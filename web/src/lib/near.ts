import { CONTRACT_ID, RPC_URL } from "./config";

function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

/**
 * Call a read-only contract method over NEAR RPC. No wallet, no backend.
 */
export async function view<T>(method: string, args: Record<string, unknown> = {}): Promise<T> {
  const response = await fetch(RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "broca",
      method: "query",
      params: {
        request_type: "call_function",
        finality: "final",
        account_id: CONTRACT_ID,
        method_name: method,
        args_base64: toBase64(JSON.stringify(args)),
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`RPC request failed: ${response.status}`);
  }

  const json = (await response.json()) as {
    error?: { message?: string };
    result?: { result: number[] };
  };

  if (json.error) {
    throw new Error(json.error.message ?? "RPC error");
  }
  if (!json.result) {
    throw new Error("Empty RPC result");
  }

  const text = new TextDecoder().decode(Uint8Array.from(json.result.result));
  return JSON.parse(text) as T;
}

let configPromise: Promise<import("./types").Config> | null = null;

/** Fetch the contract config once and reuse it. */
export function loadConfig(): Promise<import("./types").Config> {
  if (!configPromise) {
    configPromise = view<import("./types").Config>("get_config");
  }
  return configPromise;
}
