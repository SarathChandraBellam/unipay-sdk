/**
 * @unipay/core - Core unified API for UniPay SDK
 *
 * Provider-agnostic payment operations for Stripe, Razorpay, PayPal, and more.
 */

// Types
export type {
  CreatePaymentInput,
  PaymentStatus,
  Payment,
  RefundResult,
  WebhookVerificationResult,
  PaymentProvider,
  AdapterFactory,
  PaymentClientConfig,
  RetryConfig,
  PaymentOperationOptions,
} from './types.js';

// Errors
export {
  UniPayError,
  ProviderNotFoundError,
  InvalidConfigError,
  PaymentOperationError,
  ValidationError,
  TimeoutError,
  AbortError,
} from './errors.js';

// Registry
export {
  registerAdapter,
  getAdapter,
  hasAdapter,
  listAdapters,
} from './registry.js';

// Client
export { PaymentClient } from './client.js';
