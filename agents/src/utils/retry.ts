export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number; baseDelayMs?: number; label?: string } = {}
): Promise<T> {
  const { maxRetries = 3, baseDelayMs = 1000, label = "operation" } = options;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      const isRetryable =
        error instanceof Error &&
        (error.message.includes("429") ||
          error.message.includes("500") ||
          error.message.includes("503") ||
          error.message.includes("overloaded") ||
          error.message.includes("ECONNRESET") ||
          error.message.includes("ETIMEDOUT"));

      if (!isRetryable || attempt === maxRetries) {
        throw error;
      }

      const delay = baseDelayMs * Math.pow(2, attempt - 1);
      console.log(
        `  [retry] ${label} attempt ${attempt}/${maxRetries} failed, retrying in ${delay}ms...`
      );
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  throw new Error("unreachable");
}
