// Pricing per million tokens (USD) as of early 2026
const PRICING: Record<string, { input: number; output: number }> = {
  "claude-haiku-4-5-20251001": { input: 1.0, output: 5.0 },
  "claude-sonnet-4-6": { input: 3.0, output: 15.0 },
};

interface UsageEntry {
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  label: string;
}

export class CostTracker {
  private entries: UsageEntry[] = [];

  track(
    model: string,
    inputTokens: number,
    outputTokens: number,
    label: string
  ) {
    const pricing = PRICING[model] || { input: 3.0, output: 15.0 };
    const costUsd =
      (inputTokens * pricing.input + outputTokens * pricing.output) / 1_000_000;

    this.entries.push({ model, inputTokens, outputTokens, costUsd, label });
  }

  getTotalCost(): number {
    return this.entries.reduce((sum, e) => sum + e.costUsd, 0);
  }

  getSummary(): string {
    const total = this.getTotalCost();
    const lines = this.entries.map(
      (e) =>
        `  ${e.label}: ${e.inputTokens} in + ${e.outputTokens} out = $${e.costUsd.toFixed(4)} (${e.model})`
    );
    return [
      `Cost Summary:`,
      ...lines,
      `  Total: $${total.toFixed(4)} (~₹${(total * 85).toFixed(2)})`,
    ].join("\n");
  }
}
