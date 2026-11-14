import {
  BrocaError,
  DEFAULT_CONTRACT,
  SITE,
  agentMeta,
  htmlResponse,
  injectPage,
  jsonResponse,
  loadAgent,
  minimalShell,
  notFoundPage,
  renderAgentBody,
} from "../_lib/broca";

export async function onRequestGet(context: any): Promise<Response> {
  const raw = String(context.params.id ?? "");
  const isJson = raw.endsWith(".json");
  const account = isJson ? raw.slice(0, -5) : raw;
  if (!account) return notFound(isJson, "No agent id given.");

  const contract = context.env.CONTRACT_ID ?? DEFAULT_CONTRACT;
  try {
    const agent = await loadAgent(contract, account);
    if (!agent) return notFound(isJson, `No agent at ${account}.`);
    if (isJson) return jsonResponse({ agent });

    let shell = "";
    try {
      const response = await context.env.ASSETS.fetch(
        new URL("/index.html", context.request.url).toString(),
      );
      if (response.ok) shell = await response.text();
    } catch {
      shell = "";
    }
    const meta = agentMeta(agent);
    return htmlResponse(
      injectPage(shell || minimalShell(), {
        ...meta,
        canonical: `${SITE}/agent/${account}`,
        ogType: "profile",
        body: renderAgentBody(account, agent),
      }),
    );
  } catch (error) {
    if (error instanceof BrocaError && error.status === 404) {
      return notFound(isJson, `No agent at ${account}.`);
    }
    return isJson
      ? jsonResponse({ error: "upstream_unavailable" }, 502)
      : htmlResponse(
          notFoundPage("Temporarily unavailable", "Could not read the chain. Try again shortly."),
          502,
        );
  }
}

function notFound(isJson: boolean, message: string): Response {
  return isJson
    ? jsonResponse({ error: "not_found", message }, 404)
    : htmlResponse(notFoundPage("Agent not found", message), 404);
}
