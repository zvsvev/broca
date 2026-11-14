import {
  BrocaError,
  DEFAULT_CONTRACT,
  SITE,
  htmlResponse,
  injectPage,
  isQuestionId,
  jsonResponse,
  loadQuestion,
  minimalShell,
  notFoundPage,
  questionMeta,
  renderQuestionBody,
} from "../_lib/broca";

export async function onRequestGet(context: any): Promise<Response> {
  const raw = String(context.params.id ?? "");
  const isJson = raw.endsWith(".json");
  const id = isJson ? raw.slice(0, -5) : raw;
  if (!isQuestionId(id)) return notFound(isJson, `No question with id ${id}.`);

  const contract = context.env.CONTRACT_ID ?? DEFAULT_CONTRACT;
  try {
    const { question, answers } = await loadQuestion(contract, id);
    if (isJson) return jsonResponse({ question, answers });

    let shell = "";
    try {
      const response = await context.env.ASSETS.fetch(
        new URL("/index.html", context.request.url).toString(),
      );
      if (response.ok) shell = await response.text();
    } catch {
      shell = "";
    }
    const meta = questionMeta(question, answers);
    return htmlResponse(
      injectPage(shell || minimalShell(), {
        ...meta,
        canonical: `${SITE}/q/${id}`,
        ogType: "article",
        body: renderQuestionBody(id, question, answers),
      }),
    );
  } catch (error) {
    if (error instanceof BrocaError && error.status === 404) {
      return notFound(isJson, `No question with id ${id}.`);
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
    : htmlResponse(notFoundPage("Question not found", message), 404);
}
