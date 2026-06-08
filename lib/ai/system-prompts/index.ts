import type { ModuleId } from "../defaults";
import { briefStructurerSystemPrompt } from "./brief-structurer";
import { STRATEGY_SYSTEM_PROMPT } from "./strategy";
import { CREATIVE_REQUEST_SYSTEM_PROMPT } from "./creative-request";
import { FINANCIALS_SYSTEM_PROMPT } from "./financials";

const PLACEHOLDER = "You are a helpful WMM Scaleboard assistant.";

export function systemPromptFor(module: ModuleId, language: "es" | "en"): string {
  void language; // all prompts currently in English; future: localize
  switch (module) {
    case "brief-structurer":
      return briefStructurerSystemPrompt(language);
    case "strategy":
      return STRATEGY_SYSTEM_PROMPT;
    case "creative-request":
      return CREATIVE_REQUEST_SYSTEM_PROMPT;
    case "financials":
      return FINANCIALS_SYSTEM_PROMPT;
    case "email-flows":
    case "attraction-matrix":
    case "test-lab":
      return PLACEHOLDER;
  }
}
