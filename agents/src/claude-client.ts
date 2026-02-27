import Anthropic from "@anthropic-ai/sdk";
import { withRetry } from "./utils/retry.js";
import { CostTracker } from "./utils/cost-tracker.js";

export class ClaudeClient {
  private client: Anthropic;
  public costTracker: CostTracker;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.ANTHROPIC_API_KEY;
    if (!key) {
      throw new Error(
        "ANTHROPIC_API_KEY is required. Set it as an environment variable or pass it to the constructor."
      );
    }
    this.client = new Anthropic({ apiKey: key });
    this.costTracker = new CostTracker();
  }

  async chat(
    model: string,
    systemPrompt: string,
    userMessage: string,
    maxTokens: number = 4096,
    label: string = "chat"
  ): Promise<string> {
    const response = await withRetry(
      async () => {
        return this.client.messages.create({
          model,
          max_tokens: maxTokens,
          system: systemPrompt,
          messages: [{ role: "user", content: userMessage }],
        });
      },
      { label, maxRetries: 3 }
    );

    const text = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("");

    this.costTracker.track(
      model,
      response.usage.input_tokens,
      response.usage.output_tokens,
      label
    );

    return text;
  }
}

// Default models — using latest available IDs
export const MODELS = {
  fast: "claude-haiku-4-5-20251001",
  quality: "claude-sonnet-4-6",
} as const;
