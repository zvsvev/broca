import { NearConnector } from "@hot-labs/near-connect";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { CONTRACT_ID, NETWORK } from "./config";

const connector = new NearConnector({ network: NETWORK }) as any;

export interface CallOptions {
  gas?: string;
  deposit?: string;
}

interface WalletState {
  accountId: string;
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  call: (method: string, args: Record<string, unknown>, options?: CallOptions) => Promise<unknown>;
  sendActions: (actions: unknown[], receiverId?: string) => Promise<unknown>;
}

const WalletContext = createContext<WalletState | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [accountId, setAccountId] = useState("");
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    const onSignIn = (payload: any) => setAccountId(payload?.accounts?.[0]?.accountId ?? "");
    const onSignOut = () => setAccountId("");

    connector.on("wallet:signIn", onSignIn);
    connector.on("wallet:signOut", onSignOut);

    (async () => {
      try {
        const wallet = await connector.getConnectedWallet?.();
        if (wallet) {
          const accounts = await wallet.getAccounts();
          setAccountId(accounts?.[0]?.accountId ?? "");
        }
      } catch {
        // no previous session
      }
    })();

    return () => {
      connector.off?.("wallet:signIn", onSignIn);
      connector.off?.("wallet:signOut", onSignOut);
    };
  }, []);

  const connect = useCallback(async () => {
    setConnecting(true);
    try {
      const wallet = await connector.connect();
      const accounts = await wallet.getAccounts();
      setAccountId(accounts?.[0]?.accountId ?? "");
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      const wallet = await connector.wallet();
      await connector.disconnect(wallet);
    } catch {
      // ignore
    }
    setAccountId("");
  }, []);

  const sendActions = useCallback(async (actions: unknown[], receiverId?: string) => {
    const wallet = await connector.wallet();
    return wallet.signAndSendTransaction({
      receiverId: receiverId ?? CONTRACT_ID,
      actions,
    });
  }, []);

  const call = useCallback(
    async (method: string, args: Record<string, unknown>, options?: CallOptions) =>
      sendActions([
        {
          type: "FunctionCall",
          params: {
            methodName: method,
            args,
            gas: options?.gas ?? "100000000000000",
            deposit: options?.deposit ?? "0",
          },
        },
      ]),
    [sendActions],
  );

  const value = useMemo<WalletState>(
    () => ({ accountId, connecting, connect, disconnect, call, sendActions }),
    [accountId, connecting, connect, disconnect, call, sendActions],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletState {
  const context = useContext(WalletContext);
  if (!context) throw new Error("useWallet must be used inside WalletProvider");
  return context;
}
