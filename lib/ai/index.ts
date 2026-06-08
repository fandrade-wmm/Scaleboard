import type { AiClient } from "./AiClient";
import { AnthropicAiClient } from "./AnthropicAiClient";
import { OpenRouterAiClient } from "./OpenRouterAiClient";
import { getClientRepo } from "@/lib/repo";

export * from "./AiClient";
export * from "./defaults";
export { AnthropicAiClient } from "./AnthropicAiClient";
export { OpenRouterAiClient, toOpenRouterModel } from "./OpenRouterAiClient";

let cached: AiClient | null = null;

export function getAiClient(): AiClient {
  if (cached) return cached;
  const provider = process.env.AI_PROVIDER ?? "anthropic";
  const clientsRoot = process.env.WMM_DATA_DIR ?? "./data/clients";

  if (provider === "openrouter") {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY is required. Add it to .env.local.");
    }
    cached = new OpenRouterAiClient({
      repo: getClientRepo(),
      apiKey,
      clientsRoot,
      referer: process.env.OPENROUTER_REFERER ?? "http://localhost:3000",
      title: process.env.OPENROUTER_TITLE ?? "Scaleboard by Web My Money",
    });
    return cached;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is required. Add it to .env.local.");
  }
  cached = new AnthropicAiClient({
    repo: getClientRepo(),
    apiKey,
    clientsRoot,
  });
  return cached;
}

/** For tests only. */
export function __resetAiForTests(): void {
  cached = null;
}
