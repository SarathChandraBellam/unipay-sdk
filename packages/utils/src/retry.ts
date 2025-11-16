/**
 * Retry helper with exponential backoff and full jitter
 */

export interface RetryOptions {
  /** Maximum number of retries (default: 3) */
  maxRetries?: number;
  /** Base delay in milliseconds (default: 100) */
  baseDelayMs?: number;
  /** Maximum delay in milliseconds (default: 10000) */
  maxDelayMs?: number;
  /** Total timeout in milliseconds (optional) */
  timeoutMs?: number;
  /** Abort signal for cancellation */
  signal?: AbortSignal;
  /** Function to determine if error is retryable (default: all errors retryable) */
  isRetryable?: (error: Error) => boolean;
  /** Callback invoked before each retry */
  onRetry?: (error: Error, attempt: number) => void;
}

const DEFAULT_OPTIONS: Required<
  Omit<RetryOptions, 'signal' | 'isRetryable' | 'onRetry' | 'timeoutMs'>
> = {
  maxRetries: 3,
  baseDelayMs: 100,
  maxDelayMs: 10000,
};

/**
 * Calculate delay with exponential backoff and full jitter
 * @param attempt - Current attempt number (0-indexed)
 * @param baseDelay - Base delay in milliseconds
 * @param maxDelay - Maximum delay in milliseconds
 * @returns Delay in milliseconds
 */
function calculateDelay(attempt: number, baseDelay: number, maxDelay: number): number {
  // Exponential backoff: baseDelay * 2^attempt
  const exponentialDelay = baseDelay * Math.pow(2, attempt);

  // Cap at maxDelay
  const cappedDelay = Math.min(exponentialDelay, maxDelay);

  // Full jitter: random value between 0 and cappedDelay
  return Math.floor(Math.random() * cappedDelay);
}

/**
 * Sleep for specified milliseconds
 * @param ms - Milliseconds to sleep
 * @param signal - Optional abort signal
 */
function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error('Aborted'));
      return;
    }

    const timeout = setTimeout(resolve, ms);

    if (signal) {
      signal.addEventListener(
        'abort',
        () => {
          clearTimeout(timeout);
          reject(new Error('Aborted'));
        },
        { once: true }
      );
    }
  });
}

/**
 * Retry an async operation with exponential backoff and full jitter
 * @param fn - Async function to retry
 * @param options - Retry options
 * @returns Promise resolving to function result
 * @throws Last error if all retries exhausted
 */
export async function retry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { maxRetries, baseDelayMs, maxDelayMs, timeoutMs, signal, isRetryable, onRetry } = opts;

  let lastError: Error;
  const startTime = Date.now();

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    // Check if aborted
    if (signal?.aborted) {
      throw new Error('Operation aborted');
    }

    // Check if timeout exceeded
    if (timeoutMs && Date.now() - startTime >= timeoutMs) {
      throw new Error(`Operation timed out after ${timeoutMs}ms`);
    }

    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if error is retryable
      if (isRetryable && !isRetryable(lastError)) {
        throw lastError;
      }

      // If this was the last attempt, throw
      if (attempt >= maxRetries) {
        throw lastError;
      }

      // Calculate delay for next retry
      const delay = calculateDelay(attempt, baseDelayMs, maxDelayMs);

      // Invoke retry callback
      if (onRetry) {
        onRetry(lastError, attempt + 1);
      }

      // Wait before next retry
      await sleep(delay, signal);
    }
  }

  // Should never reach here, but TypeScript doesn't know that
  throw lastError!;
}

/**
 * Retry helper for network requests (4xx errors not retried)
 */
export async function retryNetworkRequest<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  return retry(fn, {
    ...options,
    isRetryable: (error: Error) => {
      // Don't retry client errors (4xx)
      if ('statusCode' in error) {
        const statusCode = (error as any).statusCode as number;
        return statusCode >= 500 || statusCode === 429; // Retry server errors and rate limits
      }
      // Retry network errors by default
      return true;
    },
  });
}
