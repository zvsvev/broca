import { defineConfig, type Connect, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ServerResponse } from "node:http";
import {
  BrocaError,
  CACHE_CONTROL,
  CACHE_CONTROL_404,
  DEFAULT_CONTRACT,
  SITE,
  agentMeta,
  injectPage,
  isKnownRoute,
  isQuestionId,
  loadAgent,
  loadQuestion,
  minimalShell,
  notFoundPage,
  questionMeta,
  renderAgentBody,
  renderQuestionBody,
} from "./functions/_lib/broca";

function send(res: ServerResponse, status: number, body: string, type: string): void {
  res.statusCode = status;
  res.setHeader("Content-Type", type);
  res.setHeader("Cache-Control", status === 200 ? CACHE_CONTROL : CACHE_CONTROL_404);
  res.end(body);
}

function readShell(root: string): string {
  for (const file of [resolve(root, "dist/index.html"), resolve(root, "index.html")]) {
    try {
      return readFileSync(file, "utf8");
    } catch {
      // try the next candidate
    }
  }
  return minimalShell();
}

const HTML = "text/html; charset=utf-8";
const JSON_TYPE = "application/json; charset=utf-8";

/** Mirrors the Cloudflare Pages Functions so `vite preview` serves the same pages. */
function brocaServerRendering(): Plugin {
  return {
    name: "broca-ssr-preview",
    configurePreviewServer(server) {
      const contract = process.env.VITE_CONTRACT_ID ?? DEFAULT_CONTRACT;

      server.middlewares.use(
        async (req: Connect.IncomingMessage, res: ServerResponse, next: Connect.NextFunction) => {
          const method = req.method ?? "GET";
          if (method !== "GET" && method !== "HEAD") return next();

          const rawUrl = req.url ?? "/";
          let pathname = rawUrl.split("?")[0];
          try {
            pathname = decodeURIComponent(pathname);
          } catch {
            // keep the raw path
          }

          const questionMatch = pathname.match(/^\/q\/([^/]+)$/);
          const agentMatch = pathname.match(/^\/agent\/([^/]+)$/);

          if (questionMatch || agentMatch) {
            const raw = (questionMatch ?? agentMatch)![1];
            const isJson = raw.endsWith(".json");
            const id = isJson ? raw.slice(0, -5) : raw;
            const type = isJson ? JSON_TYPE : HTML;
            try {
              if (questionMatch) {
                if (!isQuestionId(id)) {
                  return send(res, 404, notFound(isJson, `No question with id ${id}.`), type);
                }
                const { question, answers } = await loadQuestion(contract, id);
                if (isJson) return send(res, 200, JSON.stringify({ question, answers }), type);
                const meta = questionMeta(question, answers);
                return send(
                  res,
                  200,
                  injectPage(readShell(server.config.root), {
                    ...meta,
                    canonical: `${SITE}/q/${id}`,
                    ogType: "article",
                    body: renderQuestionBody(id, question, answers),
                  }),
                  type,
                );
              }

              const agent = await loadAgent(contract, id);
              if (!agent) return send(res, 404, notFound(isJson, `No agent at ${id}.`), type);
              if (isJson) return send(res, 200, JSON.stringify({ agent }), type);
              const meta = agentMeta(agent);
              return send(
                res,
                200,
                injectPage(readShell(server.config.root), {
                  ...meta,
                  canonical: `${SITE}/agent/${id}`,
                  ogType: "profile",
                  body: renderAgentBody(id, agent),
                }),
                type,
              );
            } catch (error) {
              if (error instanceof BrocaError && error.status === 404) {
                return send(res, 404, notFound(isJson, "No such question or agent."), type);
              }
              return send(
                res,
                502,
                isJson
                  ? JSON.stringify({ error: "upstream_unavailable" })
                  : notFoundPage("Temporarily unavailable", "Could not read the chain."),
                type,
              );
            }
          }

          if (isKnownRoute(pathname) || /\.[a-z0-9]+$/i.test(pathname)) return next();
          return send(res, 404, notFoundPage("Page not found", "No such page."), HTML);
        },
      );
    },
  };
}

function notFound(isJson: boolean, message: string): string {
  return isJson ? JSON.stringify({ error: "not_found", message }) : notFoundPage("Not found", message);
}

export default defineConfig({
  plugins: [react(), brocaServerRendering()],
  server: {
    port: 5173,
  },
});
