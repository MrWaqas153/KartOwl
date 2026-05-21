/**
 * Utility functions for rate limiting and request throttling
 */

/**
 * Returns a promise that resolves after a random delay within the specified range
 * Used to add unpredictable timing between scraper requests
 */
export function randomDelay(
  minMs: number = 1000,
  maxMs: number = 3000,
): Promise<void> {
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * Adds jitter to a base delay to avoid predictable patterns
 * @param baseMs - Base delay in milliseconds
 * @param jitterPercent - Percentage of base to use as jitter range (default 30%)
 */
export function delayWithJitter(
  baseMs: number,
  jitterPercent: number = 30,
): Promise<void> {
  const jitter = baseMs * (jitterPercent / 100);
  const actualDelay = baseMs + (Math.random() * jitter * 2 - jitter);
  return new Promise((resolve) =>
    setTimeout(resolve, Math.max(0, actualDelay)),
  );
}

/**
 * Executes a function with retry logic on failure
 * @param fn - The async function to execute
 * @param retries - Number of retry attempts (default 2)
 * @param delayMs - Delay between retries in ms (default 2000)
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number = 2,
  delayMs: number = 2000,
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      console.warn(`Attempt ${attempt + 1} failed:`, error);

      if (attempt < retries) {
        await delayWithJitter(delayMs);
      }
    }
  }

  throw lastError;
}
