import { describe, it, expect } from "vitest";
import { toOpenRouterModel } from "../OpenRouterAiClient";

describe("toOpenRouterModel", () => {
  it("maps internal sonnet id to openrouter slug", () => {
    expect(toOpenRouterModel("claude-sonnet-4-6")).toBe("anthropic/claude-sonnet-4.5");
  });

  it("maps internal opus id to openrouter slug", () => {
    expect(toOpenRouterModel("claude-opus-4-8")).toBe("anthropic/claude-opus-4.1");
  });

  it("passes through ids that already look like openrouter slugs", () => {
    expect(toOpenRouterModel("openai/gpt-4o-mini")).toBe("openai/gpt-4o-mini");
    expect(toOpenRouterModel("anthropic/claude-3-5-sonnet")).toBe(
      "anthropic/claude-3-5-sonnet",
    );
  });

  it("passes through unknown ids verbatim", () => {
    expect(toOpenRouterModel("future-model-xyz")).toBe("future-model-xyz");
  });
});
