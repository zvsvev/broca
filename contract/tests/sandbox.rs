//! Sandbox integration tests: deploy the real WASM to a local NEAR node and
//! exercise the full money flow (bounty payout, fee, mint/burn, refunds).
//!
//! Run with `cargo test` (unit + sandbox). The first run downloads a
//! `near-sandbox` node binary and compiles the contract to WASM.

use near_account_id::AccountId as SandboxAccountId;
use near_api::types::NearToken;
use near_api::{Account, AccountId, Contract, NetworkConfig, Signer};
use serde_json::{json, Value};
use std::str::FromStr;
use std::sync::Arc;
use testresult::TestResult;

const ONE_NEAR: u128 = 1_000_000_000_000_000_000_000_000;
const FEE_BPS: u128 = 500;
/// Short grace window so timeout tests do not have to wait.
const GRACE_NS: u64 = 1_000_000_000;

struct Env {
    network: NetworkConfig,
    contract: Contract,
    signer: Arc<Signer>,
    sandbox: near_sandbox::Sandbox,
}

fn aid(name: &str) -> AccountId {
    AccountId::from_str(name).expect("valid account id")
}

async fn funded(sandbox: &near_sandbox::Sandbox, name: &str) -> TestResult<AccountId> {
    // near-sandbox takes `near-account-id` v3, near-api uses v2; bridge by string.
    let sandbox_id: SandboxAccountId = name.parse()?;
    sandbox
        .create_account(sandbox_id)
        .initial_balance(NearToken::from_near(200))
        .send()
        .await?;
    Ok(aid(name))
}

async fn view(env: &Env, method: &str, args: Value) -> TestResult<Value> {
    let data: Value = env
        .contract
        .call_function(method, args)
        .read_only()
        .fetch_from(&env.network)
        .await?
        .data;
    Ok(data)
}

async fn ft_balance(env: &Env, who: &AccountId) -> TestResult<u128> {
    let value = view(env, "ft_balance_of", json!({ "account_id": who.to_string() })).await?;
    Ok(value.as_str().unwrap().parse()?)
}

async fn near_balance(env: &Env, who: &AccountId) -> TestResult<u128> {
    let balance = Account(who.clone())
        .tokens()
        .near_balance()
        .fetch_from(&env.network)
        .await?;
    Ok(balance.total.as_yoctonear())
}

async fn call(
    env: &Env,
    who: &AccountId,
    method: &str,
    args: Value,
    deposit: NearToken,
) -> TestResult<()> {
    env.contract
        .call_function(method, args)
        .transaction()
        .deposit(deposit)
        .with_signer(who.clone(), env.signer.clone())
        .send_to(&env.network)
        .await?
        .assert_success();
    Ok(())
}

async fn setup() -> TestResult<Env> {
    let sandbox = near_sandbox::Sandbox::start_sandbox().await?;
    let network = NetworkConfig::from_rpc_url("sandbox", sandbox.rpc_addr.parse()?);

    let wasm_path = cargo_near_build::build_with_cli(Default::default())?;
    let wasm = std::fs::read(wasm_path)?;

    let signer = Signer::from_secret_key(
        near_sandbox::config::DEFAULT_GENESIS_ACCOUNT_PRIVATE_KEY.parse()?,
    )?;

    let contract_id = funded(&sandbox, "broca.sandbox").await?;
    let treasury = funded(&sandbox, "treasury.sandbox").await?;

    Contract::deploy(contract_id.clone())
        .use_code(wasm)
        .with_init_call("new", json!({ "treasury": treasury.to_string(), "grace_ns": GRACE_NS }))?
        .with_signer(signer.clone())
        .send_to(&network)
        .await?
        .assert_success();

    Ok(Env {
        network,
        contract: Contract(contract_id),
        signer,
        sandbox,
    })
}

async fn register(env: &Env, who: &AccountId, handle: &str) -> TestResult<()> {
    call(
        env,
        who,
        "register_agent",
        json!({ "handle": handle, "bio": "sandbox agent" }),
        NearToken::from_millinear(100),
    )
    .await
}

async fn ask(env: &Env, who: &AccountId, text: &str, duration_sec: u64) -> TestResult<()> {
    call(
        env,
        who,
        "ask",
        json!({ "text": text, "duration_sec": duration_sec }),
        NearToken::from_near(1),
    )
    .await
}

async fn answer(env: &Env, who: &AccountId, question_id: u64, text: &str) -> TestResult<()> {
    call(
        env,
        who,
        "answer",
        json!({ "question_id": question_id, "text": text }),
        NearToken::from_yoctonear(0),
    )
    .await
}

async fn upvote(env: &Env, who: &AccountId, answer_id: u64) -> TestResult<()> {
    call(
        env,
        who,
        "upvote",
        json!({ "answer_id": answer_id }),
        NearToken::from_yoctonear(0),
    )
    .await
}

#[tokio::test]
async fn pick_best_pays_bounty_and_mints() -> TestResult {
    let env = setup().await?;
    let treasury = aid("treasury.sandbox");
    let alice = funded(&env.sandbox, "alice.sandbox").await?;
    let bob = funded(&env.sandbox, "bob.sandbox").await?;
    let carol = funded(&env.sandbox, "carol.sandbox").await?;

    register(&env, &alice, "alice").await?;
    register(&env, &bob, "bob").await?;
    ask(&env, &carol, "What is Broca?", 120).await?;

    answer(&env, &alice, 0, "A bounty board").await?;
    answer(&env, &bob, 0, "A Q&A for agents").await?;

    assert_eq!(ft_balance(&env, &alice).await?, 9, "answering burns 1 coin");
    assert_eq!(ft_balance(&env, &bob).await?, 9, "answering burns 1 coin");

    let alice_before = near_balance(&env, &alice).await?;
    let treasury_before = near_balance(&env, &treasury).await?;

    call(&env, &carol, "pick_best", json!({ "question_id": 0, "answer_id": 0 }), NearToken::from_yoctonear(0)).await?;

    let fee = ONE_NEAR * FEE_BPS / 10_000;
    let payout = ONE_NEAR - fee;
    assert_eq!(
        near_balance(&env, &alice).await? - alice_before,
        payout,
        "winner receives bounty minus fee"
    );
    assert_eq!(
        near_balance(&env, &treasury).await? - treasury_before,
        fee,
        "treasury receives the protocol fee"
    );
    assert_eq!(ft_balance(&env, &alice).await?, 19, "winner is minted 10 coins");

    let stats = view(&env, "get_stats", json!({})).await?;
    let supply: u128 = stats["total_supply"].as_str().unwrap().parse()?;
    let minted: u128 = stats["total_minted"].as_str().unwrap().parse()?;
    let burned: u128 = stats["total_burned"].as_str().unwrap().parse()?;
    assert_eq!(supply, minted - burned, "supply == minted - burned");

    // NEP-141 transfer still works.
    call(
        &env,
        &bob,
        "ft_transfer",
        json!({ "receiver_id": alice.to_string(), "amount": "1", "memo": null }),
        NearToken::from_yoctonear(1),
    )
    .await?;
    assert_eq!(ft_balance(&env, &alice).await?, 20);
    assert_eq!(ft_balance(&env, &bob).await?, 8);

    Ok(())
}

#[tokio::test]
async fn timeout_settle_and_refund() -> TestResult {
    let env = setup().await?;
    let alice = funded(&env.sandbox, "alice.sandbox").await?;
    let bob = funded(&env.sandbox, "bob.sandbox").await?;
    let carol = funded(&env.sandbox, "carol.sandbox").await?;
    let dave = funded(&env.sandbox, "dave.sandbox").await?;
    let erin = funded(&env.sandbox, "erin.sandbox").await?;

    for (who, handle) in [(&alice, "alice"), (&bob, "bob"), (&dave, "dave"), (&erin, "erin")] {
        register(&env, who, handle).await?;
    }

    // Question with answers: timeout settles on most upvotes.
    ask(&env, &carol, "Timeout question", 120).await?;
    answer(&env, &alice, 0, "first").await?;
    answer(&env, &bob, 0, "second").await?;
    upvote(&env, &dave, 1).await?;
    upvote(&env, &erin, 1).await?;

    // Advance the chain past the deadline + grace window.
    env.sandbox.fast_forward(1000).await?;
    call(&env, &dave, "settle", json!({ "question_id": 0 }), NearToken::from_yoctonear(0)).await?;
    let q0 = view(&env, "get_question", json!({ "question_id": 0 })).await?;
    assert_eq!(q0["status"], "Settled");
    assert_eq!(q0["winner_answer_id"], 1);
    assert_eq!(
        view(&env, "get_reputation", json!({ "account_id": bob.to_string() })).await?,
        12,
        "reputation = 10 for the win + 2 upvotes received"
    );

    // Question with no answers: timeout refunds the asker.
    ask(&env, &carol, "Refund question", 120).await?;
    let carol_before = near_balance(&env, &carol).await?;
    env.sandbox.fast_forward(1000).await?;
    call(&env, &dave, "settle", json!({ "question_id": 1 }), NearToken::from_yoctonear(0)).await?;
    let q1 = view(&env, "get_question", json!({ "question_id": 1 })).await?;
    assert_eq!(q1["status"], "Refunded");
    assert_eq!(
        near_balance(&env, &carol).await?,
        carol_before + ONE_NEAR,
        "no-answer bounty is refunded"
    );

    Ok(())
}
