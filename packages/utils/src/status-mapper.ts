/**
 * Status mappers for normalizing provider-specific statuses
 */

import type { PaymentStatus } from '@unipay/core';

/**
 * Map Stripe PaymentIntent status to normalized PaymentStatus
 * @param status - Stripe PaymentIntent status
 * @returns Normalized payment status
 */
export function mapStripeStatus(status: string | unknown): PaymentStatus {
  if (typeof status !== 'string') {
    return 'failed';
  }

  switch (status) {
    case 'requires_payment_method':
    case 'requires_confirmation':
      return 'created';
    case 'requires_action':
      return 'requires_action';
    case 'processing':
      return 'processing';
    case 'succeeded':
      return 'succeeded';
    case 'canceled':
      return 'failed';
    default:
      return 'failed';
  }
}

/**
 * Map Razorpay payment/order status to normalized PaymentStatus
 * @param status - Razorpay payment or order status
 * @param captured - Whether payment is captured (for payments)
 * @returns Normalized payment status
 */
export function mapRazorpayStatus(status: string | unknown, captured?: boolean): PaymentStatus {
  if (typeof status !== 'string') {
    return 'failed';
  }

  switch (status) {
    case 'created':
      return 'created';
    case 'authorized':
      return captured ? 'captured' : 'requires_action';
    case 'captured':
      return 'captured';
    case 'refunded':
      return 'refunded';
    case 'failed':
      return 'failed';
    case 'pending':
      return 'processing';
    default:
      return 'failed';
  }
}

/**
 * Map PayPal order/payment status to normalized PaymentStatus
 * @param status - PayPal order or capture status
 * @returns Normalized payment status
 */
export function mapPayPalStatus(status: string | unknown): PaymentStatus {
  if (typeof status !== 'string') {
    return 'failed';
  }

  switch (status) {
    case 'CREATED':
      return 'created';
    case 'SAVED':
    case 'APPROVED':
      return 'requires_action';
    case 'VOIDED':
      return 'failed';
    case 'COMPLETED':
      return 'succeeded';
    case 'PAYER_ACTION_REQUIRED':
      return 'requires_action';
    case 'PENDING':
      return 'processing';
    case 'REFUNDED':
      return 'refunded';
    case 'PARTIALLY_REFUNDED':
      return 'refunded';
    case 'DECLINED':
    case 'FAILED':
      return 'failed';
    default:
      return 'failed';
  }
}

/**
 * Generic status mapper that routes to provider-specific mapper
 * @param provider - Provider name
 * @param status - Provider-specific status
 * @param metadata - Additional metadata (e.g., captured flag for Razorpay)
 * @returns Normalized payment status
 */
export function mapPaymentStatus(
  provider: string,
  status: string | unknown,
  metadata?: Record<string, any>
): PaymentStatus {
  switch (provider.toLowerCase()) {
    case 'stripe':
      return mapStripeStatus(status);
    case 'razorpay':
      return mapRazorpayStatus(status, metadata?.captured);
    case 'paypal':
      return mapPayPalStatus(status);
    default:
      return 'failed';
  }
}
