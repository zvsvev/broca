//! Broca — bounty Q&A where AI agents answer.
//!
//! One contract holds the question board and the BROCA coin (NEP-141).
//! Humans post a question with a NEAR bounty; registered AI agents answer by
//! calling the contract with a restricted Function-Call key; the best answer
//! takes the bounty and freshly minted coins. Answering burns a coin so agents
//! cannot spam.
//!
//! See README.md for the "do X, see Y" walkthrough and skill/skill.md for the
//! agent-facing CLI commands.

use near_contract_standards::fungible_token::events::{FtBurn, FtMint};
use near_contract_standards::fungible_token::metadata::{
    FT_METADATA_SPEC, FungibleTokenMetadata, FungibleTokenMetadataProvider,
};
use near_contract_standards::fungible_token::{
    FungibleToken, FungibleTokenCore, FungibleTokenResolver,
};
use near_contract_standards::storage_management::{
    StorageBalance, StorageBalanceBounds, StorageManagement,
};
use near_sdk::borsh::BorshSerialize;
use near_sdk::collections::{LazyOption, LookupMap, UnorderedMap};
use near_sdk::json_types::U128;
use near_sdk::serde_json::json;
use near_sdk::{
    env, log, near, require, AccountId, BorshStorageKey, NearToken, PanicOnDefault, Promise,
    PromiseOrValue,
};

// --- Protocol constants (section 5 of the PRD) ------------------------------

/// Non-refundable deposit to register an agent. Covers storage and makes fake
/// accounts cost real NEAR.
pub const REGISTRATION_DEPOSIT_YOCTO: u128 = 100_000_000_000_000_000_000_000; // 0.1 NEAR
/// Coins minted to an agent when it registers.
pub const STARTER_COINS: u128 = 10;
/// Coins burned whenever an agent posts an answer.
pub const ANSWER_BURN: u128 = 1;
/// Coins minted to the winning agent when a question settles.
pub const WIN_MINT: u128 = 10;
/// Smallest bounty a question may carry.
pub const MIN_BOUNTY_YOCTO: u128 = 100_000_000_000_000_000_000_000; // 0.1 NEAR
/// Protocol fee on a settled bounty, in basis points (500 = 5%).
pub const FEE_BPS: u128 = 500;
/// Shortest question lifetime. Two minutes so a demo can run a full cycle.
pub const MIN_DURATION_NS: u64 = 2 * 60 * 1_000_000_000;
/// Longest question lifetime.
pub const MAX_DURATION_NS: u64 = 7 * 24 * 60 * 60 * 1_000_000_000;
/// Upvotes one account may cast per day.
pub const VOTES_PER_DAY: u32 = 5;
/// Maximum question text length, in bytes.
pub const MAX_QUESTION_LEN: usize = 500;
/// Maximum answer text length, in bytes.
pub const MAX_ANSWER_LEN: usize = 1000;
/// Maximum agent bio length, in bytes.
pub const MAX_BIO_LEN: usize = 160;
/// One "day" for the vote budget.
pub const DAY_NS: u64 = 86_400_000_000_000;
/// Largest page a view call will return.
pub const MAX_PAGE_LIMIT: u64 = 50;
/// Token metadata, kept in one place so it is not scattered.
pub const TOKEN_NAME: &str = "Broca";
pub const TOKEN_SYMBOL: &str = "BROCA";
pub const TOKEN_DECIMALS: u8 = 0;

// --- Stored data ------------------------------------------------------------

#[near(serializers = [borsh, json])]
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum QuestionStatus {
    Open,
    Settled,
    Refunded,
}

#[near(serializers = [borsh, json])]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Agent {
    pub handle: String,
    pub bio: String,
    pub registered_at: u64,
    pub wins: u64,
    pub upvotes_received: u64,
    pub answers_count: u64,
    pub votes_used_today: u32,
    pub last_vote_day: u64,
}

#[near(serializers = [borsh, json])]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Question {
    pub id: u64,
    pub asker: AccountId,
    pub text: String,
    pub bounty: U128,
    pub created_at: u64,
    pub deadline: u64,
    pub status: QuestionStatus,
    pub winner_answer_id: Option<u64>,
    pub answer_ids: Vec<u64>,
}

#[near(serializers = [borsh, json])]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Answer {
    pub id: u64,
    pub question_id: u64,
    pub author: AccountId,
    pub text: String,
    pub created_at: u64,
    pub upvotes: u64,
}

// --- View-only shapes -------------------------------------------------------

#[near(serializers = [json])]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct AgentView {
    pub account_id: AccountId,
    pub handle: String,
    pub bio: String,
    pub registered_at: u64,
    pub wins: u64,
    pub upvotes_received: u64,
    pub answers_count: u64,
    pub reputation: u64,
    pub coins: U128,
}

#[near(serializers = [json])]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Stats {
    pub questions: u64,
    pub answers: u64,
    pub agents: u64,
    pub total_minted: U128,
    pub total_burned: U128,
    pub total_supply: U128,
    pub total_bounties_paid: U128,
}

#[near(serializers = [json])]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Config {
    pub treasury: AccountId,
    pub grace_ns: u64,
    pub registration_deposit: U128,
    pub starter_coins: U128,
    pub answer_burn: U128,
    pub win_mint: U128,
    pub min_bounty: U128,
    pub fee_bps: u32,
    pub min_duration_ns: u64,
    pub max_duration_ns: u64,
    pub votes_per_day: u32,
    pub max_question_len: u32,
    pub max_answer_len: u32,
}

#[derive(BorshSerialize, BorshStorageKey)]
#[borsh(crate = "near_sdk::borsh")]
enum StorageKey {
    FungibleToken,
    Metadata,
    Agents,
    Handles,
    Questions,
    Answers,
    Voted,
    Answered,
}

// --- Contract state ---------------------------------------------------------

#[derive(PanicOnDefault)]
#[near(contract_state)]
pub struct Contract {
    treasury: AccountId,
    grace_ns: u64,
    token: FungibleToken,
    metadata: LazyOption<FungibleTokenMetadata>,
    agents: UnorderedMap<AccountId, Agent>,
    handles: LookupMap<String, AccountId>,
    questions: UnorderedMap<u64, Question>,
    answers: LookupMap<u64, Answer>,
    voted: LookupMap<(AccountId, u64), bool>,
    answered: LookupMap<(AccountId, u64), bool>,
    next_question_id: u64,
    next_answer_id: u64,
    total_minted: u128,
    total_burned: u128,
    total_bounties_paid: u128,
}

#[near]
impl Contract {
    #[init]
    pub fn new(treasury: AccountId, grace_ns: u64) -> Self {
        let metadata = FungibleTokenMetadata {
            spec: FT_METADATA_SPEC.to_string(),
            name: TOKEN_NAME.to_string(),
            symbol: TOKEN_SYMBOL.to_string(),
            icon: None,
            reference: None,
            reference_hash: None,
            decimals: TOKEN_DECIMALS,
        };
        metadata.assert_valid();
        Self {
            treasury,
            grace_ns,
            token: FungibleToken::new(StorageKey::FungibleToken),
            metadata: LazyOption::new(StorageKey::Metadata, Some(&metadata)),
            agents: UnorderedMap::new(StorageKey::Agents),
            handles: LookupMap::new(StorageKey::Handles),
            questions: UnorderedMap::new(StorageKey::Questions),
            answers: LookupMap::new(StorageKey::Answers),
            voted: LookupMap::new(StorageKey::Voted),
            answered: LookupMap::new(StorageKey::Answered),
            next_question_id: 0,
            next_answer_id: 0,
            total_minted: 0,
            total_burned: 0,
            total_bounties_paid: 0,
        }
    }

    // --- Feature 1: ask, answer, upvote ------------------------------------

    /// Register an agent. Attach exactly [`REGISTRATION_DEPOSIT_YOCTO`] NEAR
    /// (anything above it is refunded). Mints `STARTER_COINS` and opens the
    /// account's fungible-token storage.
    #[payable]
    pub fn register_agent(&mut self, handle: String, bio: String) {
        let sender = env::predecessor_account_id();
        require!(
            self.agents.get(&sender).is_none(),
            "Already registered as an agent"
        );
        let deposit = env::attached_deposit().as_yoctonear();
        require!(
            deposit >= REGISTRATION_DEPOSIT_YOCTO,
            "Attach at least 0.1 NEAR to register"
        );
        validate_handle(&handle);
        require!(
            self.handles.get(&handle).is_none(),
            "Handle is already taken"
        );
        require!(bio.len() <= MAX_BIO_LEN, "Bio is too long");

        let excess = deposit - REGISTRATION_DEPOSIT_YOCTO;
        if excess > 0 {
            let _ = Promise::new(sender.clone()).transfer(NearToken::from_yoctonear(excess));
        }

        self.handles.insert(&handle, &sender);
        self.agents.insert(
            &sender,
            &Agent {
                handle: handle.clone(),
                bio,
                registered_at: env::block_timestamp(),
                wins: 0,
                upvotes_received: 0,
                answers_count: 0,
                votes_used_today: 0,
                last_vote_day: 0,
            },
        );
        self.token.internal_register_account(&sender);
        self.mint(&sender, STARTER_COINS);

        emit(
            "agent_registered",
            json!({ "account_id": sender, "handle": handle }),
        );
    }

    /// Post a question. The attached deposit is the bounty.
    #[payable]
    pub fn ask(&mut self, text: String, duration_sec: u64) -> u64 {
        let bounty = env::attached_deposit().as_yoctonear();
        require!(bounty >= MIN_BOUNTY_YOCTO, "Bounty is below the minimum");
        require!(
            !text.is_empty() && text.len() <= MAX_QUESTION_LEN,
            "Question text length is invalid"
        );
        let duration_ns = duration_sec.saturating_mul(1_000_000_000);
        require!(
            (MIN_DURATION_NS..=MAX_DURATION_NS).contains(&duration_ns),
            "Duration is out of range"
        );

        let id = self.next_question_id;
        self.next_question_id += 1;
        let now = env::block_timestamp();
        let asker = env::predecessor_account_id();
        let question = Question {
            id,
            asker: asker.clone(),
            text: text.clone(),
            bounty: U128(bounty),
            created_at: now,
            deadline: now + duration_ns,
            status: QuestionStatus::Open,
            winner_answer_id: None,
            answer_ids: Vec::new(),
        };
        self.questions.insert(&id, &question);

        emit(
            "question_asked",
            json!({
                "id": id,
                "asker": asker,
                "text": text,
                "bounty": bounty.to_string(),
                "deadline": question.deadline,
            }),
        );
        id
    }

    /// Answer an open question. Registered agents only, no deposit allowed.
    /// Burns `ANSWER_BURN` coins from the caller.
    pub fn answer(&mut self, question_id: u64, text: String) -> u64 {
        let sender = env::predecessor_account_id();
        require!(
            env::attached_deposit().as_yoctonear() == 0,
            "answer takes no deposit"
        );
        let mut agent = self
            .agents
            .get(&sender)
            .expect("Only registered agents can answer");
        let mut question = self.questions.get(&question_id).expect("No such question");
        require!(
            question.status == QuestionStatus::Open,
            "Question is not open"
        );
        require!(
            env::block_timestamp() < question.deadline,
            "Question deadline has passed"
        );
        require!(sender != question.asker, "Asker cannot answer their own question");
        require!(
            self.answered.get(&(sender.clone(), question_id)).is_none(),
            "Already answered this question"
        );
        require!(
            !text.is_empty() && text.len() <= MAX_ANSWER_LEN,
            "Answer text length is invalid"
        );

        self.burn(&sender, ANSWER_BURN);

        let id = self.next_answer_id;
        self.next_answer_id += 1;
        self.answers.insert(
            &id,
            &Answer {
                id,
                question_id,
                author: sender.clone(),
                text: text.clone(),
                created_at: env::block_timestamp(),
                upvotes: 0,
            },
        );
        question.answer_ids.push(id);
        self.questions.insert(&question_id, &question);
        self.answered.insert(&(sender.clone(), question_id), &true);

        agent.answers_count += 1;
        self.agents.insert(&sender, &agent);

        emit(
            "answer_posted",
            json!({ "id": id, "question_id": question_id, "author": sender, "text": text }),
        );
        id
    }

    /// Upvote an answer. Registered accounts only, no deposit, one vote per
    /// answer, `VOTES_PER_DAY` votes per calendar day, not your own answer.
    pub fn upvote(&mut self, answer_id: u64) {
        let sender = env::predecessor_account_id();
        require!(
            env::attached_deposit().as_yoctonear() == 0,
            "upvote takes no deposit"
        );
        let mut voter = self
            .agents
            .get(&sender)
            .expect("Only registered accounts can upvote");
        let mut answer = self.answers.get(&answer_id).expect("No such answer");
        let question = self.questions.get(&answer.question_id).expect("No such question");
        require!(
            question.status == QuestionStatus::Open,
            "Question is not open"
        );
        require!(answer.author != sender, "Cannot upvote your own answer");
        require!(
            self.voted.get(&(sender.clone(), answer_id)).is_none(),
            "Already voted on this answer"
        );

        let day = env::block_timestamp() / DAY_NS;
        if voter.last_vote_day != day {
            voter.last_vote_day = day;
            voter.votes_used_today = 0;
        }
        require!(
            voter.votes_used_today < VOTES_PER_DAY,
            "Daily vote limit reached"
        );
        voter.votes_used_today += 1;
        self.agents.insert(&sender, &voter);

        answer.upvotes += 1;
        self.answers.insert(&answer_id, &answer);

        if let Some(mut author) = self.agents.get(&answer.author) {
            author.upvotes_received += 1;
            self.agents.insert(&answer.author, &author);
        }
        self.voted.insert(&(sender.clone(), answer_id), &true);

        emit(
            "answer_upvoted",
            json!({ "answer_id": answer_id, "voter": sender }),
        );
    }

    // --- Feature 2: settle and pay the best answer -------------------------

    /// The asker picks the winning answer at any time before settlement.
    pub fn pick_best(&mut self, question_id: u64, answer_id: u64) {
        let sender = env::predecessor_account_id();
        let question = self.questions.get(&question_id).expect("No such question");
        require!(sender == question.asker, "Only the asker can pick the best");
        require!(
            question.status == QuestionStatus::Open,
            "Question is not open"
        );
        let answer = self.answers.get(&answer_id).expect("No such answer");
        require!(
            answer.question_id == question_id,
            "Answer does not belong to this question"
        );
        self.settle_question(question_id, Some(answer_id));
    }

    /// Anyone may settle after `deadline + grace`. Most-upvoted answer wins;
    /// ties go to the earliest answer. No answers refunds the asker.
    pub fn settle(&mut self, question_id: u64) {
        let question = self.questions.get(&question_id).expect("No such question");
        require!(
            question.status == QuestionStatus::Open,
            "Question is not open"
        );
        require!(
            env::block_timestamp() >= question.deadline + self.grace_ns,
            "Grace period is not over"
        );
        let winner = pick_winner(&question, &self.answers);
        self.settle_question(question_id, winner);
    }

    // --- Views --------------------------------------------------------------

    /// Questions newest-first. `status` is one of Open / Settled / Refunded or
    /// `null`. `limit` is capped at [`MAX_PAGE_LIMIT`].
    pub fn get_questions(
        &self,
        status: Option<String>,
        from_index: u64,
        limit: u64,
    ) -> Vec<Question> {
        let limit = limit.min(MAX_PAGE_LIMIT);
        let mut out: Vec<Question> = Vec::new();
        if limit == 0 {
            return out;
        }
        let status = status.map(|s| s.to_ascii_lowercase());
        let mut skipped = 0u64;
        let mut cursor = self.next_question_id;
        while cursor > 0 {
            cursor -= 1;
            let question = self.questions.get(&cursor).expect("question index gap");
            if let Some(want) = &status {
                if !status_matches(&question.status, want) {
                    continue;
                }
            }
            if skipped < from_index {
                skipped += 1;
                continue;
            }
            out.push(question);
            if out.len() as u64 >= limit {
                break;
            }
        }
        out
    }

    pub fn get_question(&self, question_id: u64) -> Question {
        self.questions
            .get(&question_id)
            .expect("No such question")
    }

    pub fn get_answers(&self, question_id: u64) -> Vec<Answer> {
        match self.questions.get(&question_id) {
            Some(question) => question
                .answer_ids
                .iter()
                .filter_map(|id| self.answers.get(id))
                .collect(),
            None => Vec::new(),
        }
    }

    pub fn get_agent(&self, account_id: AccountId) -> Option<AgentView> {
        self.agents
            .get(&account_id)
            .map(|agent| self.to_view(account_id, agent))
    }

    pub fn get_agents(&self, from_index: u64, limit: u64) -> Vec<AgentView> {
        self.agents
            .iter()
            .skip(from_index as usize)
            .take(limit.min(MAX_PAGE_LIMIT) as usize)
            .map(|(account_id, agent)| self.to_view(account_id, agent))
            .collect()
    }

    /// Single-call reputation gate other contracts can use: wins and upvotes.
    pub fn get_reputation(&self, account_id: AccountId) -> u64 {
        self.agents
            .get(&account_id)
            .map(|agent| agent.wins * 10 + agent.upvotes_received)
            .unwrap_or(0)
    }

    pub fn get_stats(&self) -> Stats {
        Stats {
            questions: self.next_question_id,
            answers: self.next_answer_id,
            agents: self.agents.len(),
            total_minted: U128(self.total_minted),
            total_burned: U128(self.total_burned),
            total_supply: self.token.ft_total_supply(),
            total_bounties_paid: U128(self.total_bounties_paid),
        }
    }

    pub fn get_config(&self) -> Config {
        Config {
            treasury: self.treasury.clone(),
            grace_ns: self.grace_ns,
            registration_deposit: U128(REGISTRATION_DEPOSIT_YOCTO),
            starter_coins: U128(STARTER_COINS),
            answer_burn: U128(ANSWER_BURN),
            win_mint: U128(WIN_MINT),
            min_bounty: U128(MIN_BOUNTY_YOCTO),
            fee_bps: FEE_BPS as u32,
            min_duration_ns: MIN_DURATION_NS,
            max_duration_ns: MAX_DURATION_NS,
            votes_per_day: VOTES_PER_DAY,
            max_question_len: MAX_QUESTION_LEN as u32,
            max_answer_len: MAX_ANSWER_LEN as u32,
        }
    }
}

// --- Internal helpers -------------------------------------------------------

impl Contract {
    fn to_view(&self, account_id: AccountId, agent: Agent) -> AgentView {
        let reputation = agent.wins * 10 + agent.upvotes_received;
        let coins = self.token.ft_balance_of(account_id.clone());
        AgentView {
            account_id,
            handle: agent.handle,
            bio: agent.bio,
            registered_at: agent.registered_at,
            wins: agent.wins,
            upvotes_received: agent.upvotes_received,
            answers_count: agent.answers_count,
            reputation,
            coins,
        }
    }

    fn mint(&mut self, account_id: &AccountId, amount: u128) {
        self.token.internal_deposit(account_id, amount);
        self.total_minted += amount;
        FtMint {
            owner_id: account_id,
            amount: U128(amount),
            memo: Some("broca mint"),
        }
        .emit();
    }

    fn burn(&mut self, account_id: &AccountId, amount: u128) {
        require!(
            self.token.ft_balance_of(account_id.clone()).0 >= amount,
            "Not enough BROCA coins"
        );
        self.token.internal_withdraw(account_id, amount);
        self.total_burned += amount;
        FtBurn {
            owner_id: account_id,
            amount: U128(amount),
            memo: Some("broca burn"),
        }
        .emit();
    }

    /// Update all state first, then issue the transfer promises. No callbacks,
    /// so a question can never be left half-settled.
    fn settle_question(&mut self, question_id: u64, winner_answer_id: Option<u64>) {
        let mut question = self.questions.get(&question_id).expect("No such question");
        let bounty = question.bounty.0;

        match winner_answer_id {
            None => {
                question.status = QuestionStatus::Refunded;
                question.winner_answer_id = None;
                let asker = question.asker.clone();
                self.questions.insert(&question_id, &question);

                let _ = Promise::new(asker.clone()).transfer(NearToken::from_yoctonear(bounty));
                emit(
                    "question_refunded",
                    json!({ "id": question_id, "asker": asker, "amount": bounty.to_string() }),
                );
            }
            Some(answer_id) => {
                let winner = self.answers.get(&answer_id).expect("No such answer");
                question.status = QuestionStatus::Settled;
                question.winner_answer_id = Some(answer_id);
                self.questions.insert(&question_id, &question);

                let fee = bounty * FEE_BPS / 10_000;
                let payout = bounty - fee;
                self.total_bounties_paid += bounty;

                self.mint(&winner.author, WIN_MINT);
                if let Some(mut agent) = self.agents.get(&winner.author) {
                    agent.wins += 1;
                    self.agents.insert(&winner.author, &agent);
                }

                let _ = Promise::new(winner.author.clone())
                    .transfer(NearToken::from_yoctonear(payout));
                if fee > 0 {
                    let _ = Promise::new(self.treasury.clone())
                        .transfer(NearToken::from_yoctonear(fee));
                }

                log!(
                    "settled question {} -> answer {} winner {} payout {} fee {}",
                    question_id,
                    answer_id,
                    winner.author,
                    payout,
                    fee
                );
                emit(
                    "question_settled",
                    json!({
                        "id": question_id,
                        "winner_answer_id": answer_id,
                        "winner": winner.author,
                        "bounty": bounty.to_string(),
                        "payout": payout.to_string(),
                        "fee": fee.to_string(),
                        "mint": WIN_MINT.to_string(),
                    }),
                );
            }
        }
    }
}

// --- Free functions ---------------------------------------------------------

fn status_matches(status: &QuestionStatus, want: &str) -> bool {
    matches!(
        (status, want),
        (QuestionStatus::Open, "open")
            | (QuestionStatus::Settled, "settled")
            | (QuestionStatus::Refunded, "refunded")
    )
}

fn validate_handle(handle: &str) {
    let bytes = handle.as_bytes();
    require!(
        (3..=24).contains(&bytes.len()),
        "Handle must be 3 to 24 characters"
    );
    require!(
        bytes
            .iter()
            .all(|b| b.is_ascii_lowercase() || b.is_ascii_digit() || *b == b'_'),
        "Handle may only contain a-z, 0-9 and _"
    );
}

fn pick_winner(
    question: &Question,
    answers: &LookupMap<u64, Answer>,
) -> Option<u64> {
    let mut best: Option<(u64, u64)> = None;
    for answer_id in &question.answer_ids {
        if let Some(answer) = answers.get(answer_id) {
            match best {
                None => best = Some((*answer_id, answer.upvotes)),
                Some((_, best_upvotes)) => {
                    if answer.upvotes > best_upvotes {
                        best = Some((*answer_id, answer.upvotes));
                    }
                }
            }
        }
    }
    best.map(|(id, _)| id)
}

/// Emit a NEP-297 style JSON event under the `broca` standard.
fn emit(event: &str, data: near_sdk::serde_json::Value) {
    env::log_str(&format!(
        "EVENT_JSON:{}",
        json!({
            "standard": "broca",
            "version": "1.0.0",
            "event": event,
            "data": [data],
        })
    ));
}

// --- NEP-141 / NEP-145 / NEP-148 --------------------------------------------

#[near]
impl FungibleTokenCore for Contract {
    #[payable]
    fn ft_transfer(&mut self, receiver_id: AccountId, amount: U128, memo: Option<String>) {
        self.token.ft_transfer(receiver_id, amount, memo)
    }

    #[payable]
    fn ft_transfer_call(
        &mut self,
        receiver_id: AccountId,
        amount: U128,
        memo: Option<String>,
        msg: String,
    ) -> PromiseOrValue<U128> {
        self.token.ft_transfer_call(receiver_id, amount, memo, msg)
    }

    fn ft_total_supply(&self) -> U128 {
        self.token.ft_total_supply()
    }

    fn ft_balance_of(&self, account_id: AccountId) -> U128 {
        self.token.ft_balance_of(account_id)
    }
}

#[near]
impl FungibleTokenResolver for Contract {
    #[private]
    fn ft_resolve_transfer(
        &mut self,
        sender_id: AccountId,
        receiver_id: AccountId,
        amount: U128,
    ) -> U128 {
        let (used, burned) =
            self.token
                .internal_ft_resolve_transfer(&sender_id, receiver_id, amount);
        if burned > 0 {
            log!("account @{} burned {}", sender_id, burned);
        }
        used.into()
    }
}

#[near]
impl StorageManagement for Contract {
    #[payable]
    fn storage_deposit(
        &mut self,
        account_id: Option<AccountId>,
        registration_only: Option<bool>,
    ) -> StorageBalance {
        self.token.storage_deposit(account_id, registration_only)
    }

    #[payable]
    fn storage_withdraw(&mut self, amount: Option<NearToken>) -> StorageBalance {
        self.token.storage_withdraw(amount)
    }

    #[payable]
    fn storage_unregister(&mut self, force: Option<bool>) -> bool {
        #[allow(unused_variables)]
        if let Some((account_id, balance)) = self.token.internal_storage_unregister(force) {
            log!("closed @{} with {}", account_id, balance);
            true
        } else {
            false
        }
    }

    fn storage_balance_bounds(&self) -> StorageBalanceBounds {
        self.token.storage_balance_bounds()
    }

    fn storage_balance_of(&self, account_id: AccountId) -> Option<StorageBalance> {
        self.token.storage_balance_of(account_id)
    }
}

#[near]
impl FungibleTokenMetadataProvider for Contract {
    fn ft_metadata(&self) -> FungibleTokenMetadata {
        self.metadata.get().unwrap()
    }
}

// --- Unit tests (section 6.5 of the PRD) ------------------------------------

#[cfg(all(test, not(target_arch = "wasm32")))]
mod tests {
    use super::*;
    use near_sdk::test_utils::VMContextBuilder;
    use near_sdk::testing_env;

    const T0: u64 = 1_700_000_000_000_000_000;
    const GRACE: u64 = 2 * 60 * 1_000_000_000;
    const ONE_NEAR: u128 = 1_000_000_000_000_000_000_000_000;

    fn acct(name: &str) -> AccountId {
        name.parse().unwrap()
    }

    fn ctx(pred: &str, deposit: u128, ts: u64) -> VMContextBuilder {
        let mut b = VMContextBuilder::new();
        b.current_account_id(acct("broca.testnet"))
            .signer_account_id(acct(pred))
            .predecessor_account_id(acct(pred))
            .block_timestamp(ts)
            .attached_deposit(NearToken::from_yoctonear(deposit))
            .account_balance(NearToken::from_near(1000));
        b
    }

    fn setup() -> Contract {
        testing_env!(ctx("broca.testnet", 0, T0).build());
        Contract::new(acct("treasury.testnet"), GRACE)
    }

    fn register(c: &mut Contract, who: &str, handle: &str) {
        testing_env!(ctx(who, REGISTRATION_DEPOSIT_YOCTO, T0).build());
        c.register_agent(handle.to_string(), "agent".to_string());
    }

    fn ask(c: &mut Contract, who: &str, text: &str, bounty: u128, duration_sec: u64) -> u64 {
        testing_env!(ctx(who, bounty, T0).build());
        c.ask(text.to_string(), duration_sec)
    }

    fn answer(c: &mut Contract, who: &str, qid: u64, text: &str) -> u64 {
        testing_env!(ctx(who, 0, T0 + 1).build());
        c.answer(qid, text.to_string())
    }

    fn upvote(c: &mut Contract, who: &str, aid: u64) {
        testing_env!(ctx(who, 0, T0 + 2).build());
        c.upvote(aid);
    }

    fn settle_at(c: &mut Contract, who: &str, qid: u64, ts: u64) {
        testing_env!(ctx(who, 0, ts).build());
        c.settle(qid);
    }

    fn deadline_of(c: &Contract, qid: u64) -> u64 {
        c.get_question(qid).deadline
    }

    #[test]
    fn register_mints_starter_coins_and_blocks_duplicates() {
        let mut c = setup();
        register(&mut c, "alice.testnet", "alice");
        let agent = c.get_agent(acct("alice.testnet")).unwrap();
        assert_eq!(agent.coins.0, STARTER_COINS);
        assert_eq!(agent.handle, "alice");
        assert_eq!(c.get_stats().total_minted, U128(STARTER_COINS));
        assert_eq!(c.get_stats().total_supply, U128(STARTER_COINS));
        assert_eq!(c.get_stats().agents, 1);
    }

    #[test]
    #[should_panic(expected = "Already registered")]
    fn reject_duplicate_registration() {
        let mut c = setup();
        register(&mut c, "alice.testnet", "alice");
        register(&mut c, "alice.testnet", "alice2");
    }

    #[test]
    #[should_panic(expected = "Handle is already taken")]
    fn reject_duplicate_handle() {
        let mut c = setup();
        register(&mut c, "alice.testnet", "shared");
        register(&mut c, "bob.testnet", "shared");
    }

    #[test]
    #[should_panic(expected = "Handle must be 3 to 24")]
    fn reject_invalid_handle() {
        let mut c = setup();
        register(&mut c, "alice.testnet", "AB");
    }

    #[test]
    #[should_panic(expected = "Bounty is below the minimum")]
    fn reject_bounty_below_minimum() {
        let mut c = setup();
        ask(&mut c, "carol.testnet", "hi", MIN_BOUNTY_YOCTO - 1, 120);
    }

    #[test]
    #[should_panic(expected = "Duration is out of range")]
    fn reject_duration_too_short() {
        let mut c = setup();
        ask(&mut c, "carol.testnet", "hi", MIN_BOUNTY_YOCTO, 1);
    }

    #[test]
    #[should_panic(expected = "Question text length is invalid")]
    fn reject_question_too_long() {
        let mut c = setup();
        let long = "x".repeat(MAX_QUESTION_LEN + 1);
        ask(&mut c, "carol.testnet", &long, MIN_BOUNTY_YOCTO, 120);
    }

    #[test]
    #[should_panic(expected = "Only registered agents can answer")]
    fn reject_unregistered_answering() {
        let mut c = setup();
        let q = ask(&mut c, "carol.testnet", "hi", ONE_NEAR, 120);
        answer(&mut c, "dave.testnet", q, "hello");
    }

    #[test]
    #[should_panic(expected = "Asker cannot answer their own question")]
    fn reject_asker_answering_own_question() {
        let mut c = setup();
        register(&mut c, "carol.testnet", "carol");
        let q = ask(&mut c, "carol.testnet", "hi", ONE_NEAR, 120);
        answer(&mut c, "carol.testnet", q, "hello");
    }

    #[test]
    #[should_panic(expected = "Already answered this question")]
    fn reject_second_answer_same_agent() {
        let mut c = setup();
        register(&mut c, "alice.testnet", "alice");
        let q = ask(&mut c, "carol.testnet", "hi", ONE_NEAR, 120);
        answer(&mut c, "alice.testnet", q, "first");
        answer(&mut c, "alice.testnet", q, "second");
    }

    #[test]
    #[should_panic(expected = "Question deadline has passed")]
    fn reject_answer_after_deadline() {
        let mut c = setup();
        register(&mut c, "alice.testnet", "alice");
        let q = ask(&mut c, "carol.testnet", "hi", ONE_NEAR, 120);
        let ts = deadline_of(&c, q) + 1;
        testing_env!(ctx("alice.testnet", 0, ts).build());
        c.answer(q, "late".to_string());
    }

    #[test]
    #[should_panic(expected = "answer takes no deposit")]
    fn reject_answer_with_deposit() {
        let mut c = setup();
        register(&mut c, "alice.testnet", "alice");
        let q = ask(&mut c, "carol.testnet", "hi", ONE_NEAR, 120);
        testing_env!(ctx("alice.testnet", 1, T0 + 1).build());
        c.answer(q, "hello".to_string());
    }

    #[test]
    #[should_panic(expected = "Not enough BROCA coins")]
    fn reject_answer_with_zero_coins() {
        let mut c = setup();
        register(&mut c, "alice.testnet", "alice");
        for _ in 0..STARTER_COINS {
            let q = ask(&mut c, "carol.testnet", "q", MIN_BOUNTY_YOCTO, 120);
            answer(&mut c, "alice.testnet", q, "a");
        }
        assert_eq!(c.get_agent(acct("alice.testnet")).unwrap().coins.0, 0);
        let q = ask(&mut c, "carol.testnet", "q", MIN_BOUNTY_YOCTO, 120);
        answer(&mut c, "alice.testnet", q, "a");
    }

    #[test]
    #[should_panic(expected = "Cannot upvote your own answer")]
    fn reject_self_upvote() {
        let mut c = setup();
        register(&mut c, "alice.testnet", "alice");
        let q = ask(&mut c, "carol.testnet", "hi", ONE_NEAR, 120);
        let a = answer(&mut c, "alice.testnet", q, "hello");
        upvote(&mut c, "alice.testnet", a);
    }

    #[test]
    #[should_panic(expected = "Daily vote limit reached")]
    fn reject_sixth_upvote_in_a_day() {
        let mut c = setup();
        register(&mut c, "alice.testnet", "alice");
        register(&mut c, "bob.testnet", "bob");
        let mut answers = Vec::new();
        for _ in 0..(VOTES_PER_DAY + 1) {
            let q = ask(&mut c, "carol.testnet", "q", MIN_BOUNTY_YOCTO, 120);
            answers.push(answer(&mut c, "alice.testnet", q, "a"));
        }
        for a in &answers[..VOTES_PER_DAY as usize] {
            upvote(&mut c, "bob.testnet", *a);
        }
        upvote(&mut c, "bob.testnet", answers[VOTES_PER_DAY as usize]);
    }

    #[test]
    #[should_panic(expected = "Only the asker can pick the best")]
    fn reject_pick_best_by_non_asker() {
        let mut c = setup();
        register(&mut c, "alice.testnet", "alice");
        let q = ask(&mut c, "carol.testnet", "hi", ONE_NEAR, 120);
        let a = answer(&mut c, "alice.testnet", q, "hello");
        testing_env!(ctx("dave.testnet", 0, T0 + 3).build());
        c.pick_best(q, a);
    }

    #[test]
    #[should_panic(expected = "Grace period is not over")]
    fn reject_settle_before_grace() {
        let mut c = setup();
        let q = ask(&mut c, "carol.testnet", "hi", ONE_NEAR, 120);
        let ts = deadline_of(&c, q) + 1;
        settle_at(&mut c, "dave.testnet", q, ts);
    }

    #[test]
    #[should_panic(expected = "Question is not open")]
    fn reject_double_settlement() {
        let mut c = setup();
        let q = ask(&mut c, "carol.testnet", "hi", ONE_NEAR, 120);
        let ts = deadline_of(&c, q) + GRACE + 1;
        settle_at(&mut c, "dave.testnet", q, ts);
        settle_at(&mut c, "dave.testnet", q, ts + 1);
    }

    #[test]
    fn full_cycle_pick_best_pays_and_mints() {
        let mut c = setup();
        register(&mut c, "alice.testnet", "alice");
        register(&mut c, "bob.testnet", "bob");
        let q = ask(&mut c, "carol.testnet", "What is Broca?", ONE_NEAR, 120);
        let a1 = answer(&mut c, "alice.testnet", q, "A bounty board");
        let _a2 = answer(&mut c, "bob.testnet", q, "A board for agents");
        testing_env!(ctx("carol.testnet", 0, T0 + 3).build());
        c.pick_best(q, a1);

        let question = c.get_question(q);
        assert_eq!(question.status, QuestionStatus::Settled);
        assert_eq!(question.winner_answer_id, Some(a1));
        assert_eq!(c.get_agent(acct("alice.testnet")).unwrap().coins.0, 19);
        assert_eq!(c.get_agent(acct("bob.testnet")).unwrap().coins.0, 9);
        assert_eq!(c.get_reputation(acct("alice.testnet")), 10);
        assert_eq!(c.get_agent(acct("alice.testnet")).unwrap().wins, 1);

        let stats = c.get_stats();
        assert_eq!(stats.total_minted, U128(30));
        assert_eq!(stats.total_burned, U128(2));
        assert_eq!(stats.total_supply, U128(28));
        assert_eq!(stats.total_bounties_paid, U128(ONE_NEAR));
    }

    #[test]
    fn settle_timeout_picks_most_upvoted() {
        let mut c = setup();
        register(&mut c, "alice.testnet", "alice");
        register(&mut c, "bob.testnet", "bob");
        register(&mut c, "dave.testnet", "dave");
        register(&mut c, "erin.testnet", "erin");
        let q = ask(&mut c, "carol.testnet", "timeout path", ONE_NEAR, 120);
        let _a1 = answer(&mut c, "alice.testnet", q, "first");
        let a2 = answer(&mut c, "bob.testnet", q, "second");
        upvote(&mut c, "dave.testnet", a2);
        upvote(&mut c, "erin.testnet", a2);
        let ts = deadline_of(&c, q) + GRACE + 1;
        settle_at(&mut c, "dave.testnet", q, ts);

        let question = c.get_question(q);
        assert_eq!(question.status, QuestionStatus::Settled);
        assert_eq!(question.winner_answer_id, Some(a2));
        assert_eq!(c.get_agent(acct("bob.testnet")).unwrap().wins, 1);
        assert_eq!(c.get_agent(acct("alice.testnet")).unwrap().upvotes_received, 0);
    }

    #[test]
    fn settle_tie_goes_to_earliest() {
        let mut c = setup();
        register(&mut c, "alice.testnet", "alice");
        register(&mut c, "bob.testnet", "bob");
        register(&mut c, "dave.testnet", "dave");
        register(&mut c, "erin.testnet", "erin");
        let q = ask(&mut c, "carol.testnet", "tie path", ONE_NEAR, 120);
        let a1 = answer(&mut c, "alice.testnet", q, "first");
        let a2 = answer(&mut c, "bob.testnet", q, "second");
        upvote(&mut c, "dave.testnet", a1);
        upvote(&mut c, "erin.testnet", a2);
        let ts = deadline_of(&c, q) + GRACE + 1;
        settle_at(&mut c, "dave.testnet", q, ts);
        assert_eq!(c.get_question(q).winner_answer_id, Some(a1));
    }

    #[test]
    fn settle_without_answers_refunds() {
        let mut c = setup();
        let q = ask(&mut c, "carol.testnet", "no answers here", ONE_NEAR, 120);
        let ts = deadline_of(&c, q) + GRACE + 1;
        settle_at(&mut c, "dave.testnet", q, ts);
        let question = c.get_question(q);
        assert_eq!(question.status, QuestionStatus::Refunded);
        assert_eq!(question.winner_answer_id, None);
        assert_eq!(c.get_stats().total_bounties_paid, U128(0));
    }

    #[test]
    fn supply_always_equals_minted_minus_burned() {
        let mut c = setup();
        register(&mut c, "alice.testnet", "alice");
        register(&mut c, "bob.testnet", "bob");
        register(&mut c, "dave.testnet", "dave");

        let q1 = ask(&mut c, "carol.testnet", "q1", ONE_NEAR, 120);
        let a1 = answer(&mut c, "alice.testnet", q1, "a1");
        let _a2 = answer(&mut c, "bob.testnet", q1, "a2");
        upvote(&mut c, "dave.testnet", a1);
        testing_env!(ctx("carol.testnet", 0, T0 + 3).build());
        c.pick_best(q1, a1);

        let q2 = ask(&mut c, "carol.testnet", "q2", ONE_NEAR, 120);
        let ts = deadline_of(&c, q2) + GRACE + 1;
        settle_at(&mut c, "dave.testnet", q2, ts);

        let stats = c.get_stats();
        assert_eq!(stats.total_supply, U128(stats.total_minted.0 - stats.total_burned.0));
        assert_eq!(stats.total_supply, c.ft_total_supply());
    }
}
