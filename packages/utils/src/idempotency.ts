/**
 * Idempotency helper for payment operations
 */

import { randomUUID } from 'crypto';

/**
 * Generate a UUID-based idempotency key
 * @param prefix - Optional prefix for the key
 * @returns Idempotency key
 */
export function generateIdempotencyKey(prefix?: string): string {
  const uuid = randomUUID();
  return prefix ? `${prefix}_${uuid}` : uuid;
}

/**
 * Attach idempotency headers for Stripe
 * @param headers - Existing headers
 * @param idempotencyKey - Idempotency key
 * @returns Headers with idempotency key
 */
export function attachStripeIdempotencyHeaders(
  headers: Record<string, string>,
  idempotencyKey: string
): Record<string, string> {
  return {
    ...headers,
    'Idempotency-Key': idempotencyKey,
  };
}

/**
 * Attach idempotency headers for Razorpay
 * @param headers - Existing headers
 * @param idempotencyKey - Idempotency key
 * @returns Headers with idempotency key
 */
export function attachRazorpayIdempotencyHeaders(
  headers: Record<string, string>,
  idempotencyKey: string
): Record<string, string> {
  return {
    ...headers,
    'X-Razorpay-Idempotency-Key': idempotencyKey,
  };
}

/**
 * Attach idempotency headers for PayPal
 * @param headers - Existing headers
 * @param idempotencyKey - Idempotency key
 * @returns Headers with idempotency key
 */
export function attachPayPalIdempotencyHeaders(
  headers: Record<string, string>,
  idempotencyKey: string
): Record<string, string> {
  return {
    ...headers,
    'PayPal-Request-Id': idempotencyKey,
  };
}

/**
 * Generic function to attach provider-specific idempotency headers
 * @param provider - Provider name
 * @param headers - Existing headers
 * @param idempotencyKey - Idempotency key
 * @returns Headers with idempotency key
 */
export function attachIdempotencyHeaders(
  provider: string,
  headers: Record<string, string>,
  idempotencyKey: string
): Record<string, string> {
  switch (provider.toLowerCase()) {
    case 'stripe':
      return attachStripeIdempotencyHeaders(headers, idempotencyKey);
    case 'razorpay':
      return attachRazorpayIdempotencyHeaders(headers, idempotencyKey);
    case 'paypal':
      return attachPayPalIdempotencyHeaders(headers, idempotencyKey);
    default:
      // Generic header
      return {
        ...headers,
        'Idempotency-Key': idempotencyKey,
      };
  }
}
