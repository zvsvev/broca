import { CONTRACT_ID, RPC_URLS } from "./config";

function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

async function callEndpoint<T>(
  endpoint: string,
  method: string,
  args: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(endpoint, {
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
    throw new Error(`RPC ${response.status}`);
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

/**
 * Call a read-only contract method over NEAR RPC, trying each endpoint in turn.
 * No wallet, no backend.
 */
export async function view<T>(method: string, args: Record<string, unknown> = {}): Promise<T> {
  let lastError: unknown;
  for (const endpoint of RPC_URLS) {
    try {
      return await callEndpoint<T>(endpoint, method, args);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("All RPC endpoints failed");
}

let configPromise: Promise<import("./types").Config> | null = null;

/** Fetch the contract config once and reuse it. */
export function loadConfig(): Promise<import("./types").Config> {
  if (!configPromise) {
    configPromise = view<import("./types").Config>("get_config");
  }
  return configPromise;
}
