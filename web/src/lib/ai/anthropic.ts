import Anthropic from "@anthropic-ai/sdk";

// Lazy-initialized client — key is checked at request time, not build time
let _client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!_client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY environment variable is required");
    }
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _client;
}

export const CLAUDE_MODEL = "claude-sonnet-4-6";
export const MAX_TOKENS = 4096;
