import { describe, it, expect, vi } from 'vitest';
import { retry } from '../src/retry.js';

describe('Retry Helper', () => {
  it('should succeed on first attempt', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    const result = await retry(fn, { maxRetries: 3 });

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('success');

    const result = await retry(fn, { maxRetries: 3, baseDelayMs: 10 });

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should throw after max retries', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('fail'));

    await expect(retry(fn, { maxRetries: 2, baseDelayMs: 10 })).rejects.toThrow('fail');
    expect(fn).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
  });

  it('should not retry if error is not retryable', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('not retryable'));

    await expect(
      retry(fn, {
        maxRetries: 3,
        isRetryable: () => false,
      })
    ).rejects.toThrow('not retryable');

    expect(fn).toHaveBeenCalledTimes(1);
  });
});
