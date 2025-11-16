/**
 * Core types for UniPay SDK
 */

/**
 * Input for creating a payment
 */
export interface CreatePaymentInput {
  /** Amount in smallest currency unit (e.g., cents for USD) */
  amount: number;
  /** ISO 4217 currency code (e.g., 'USD', 'INR', 'EUR') */
  currency: string;
  /** Description of the payment */
  description?: string;
  /** Additional metadata to attach to the payment */
  metadata?: Record<string, string>;
  /** Customer ID (provider-specific) */
  customerId?: string;
  /** Whether to automatically capture the payment (default: true) */
  capture?: boolean;
  /** Allowed payment method types (provider-specific) */
  paymentMethodTypes?: string[];
  /** Return URL for redirect-based flows */
  returnUrl?: string;
  /** Application ID for multi-tenant scenarios */
  appId?: string;
}

/**
 * Normalized payment status across all providers
 */
export type PaymentStatus =
  | 'created'
  | 'requires_action'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'captured'
  | 'refunded';

/**
 * Normalized payment object
 */
export interface Payment {
  /** SDK-generated ID: <provider>_<nativeId> */
  id: string;
  /** Provider name (stripe, razorpay, paypal) */
  provider: string;
  /** Original payment ID from the provider */
  providerPaymentId?: string;
  /** Amount in smallest currency unit */
  amount: number;
  /** ISO 4217 currency code */
  currency: string;
  /** Normalized payment status */
  status: PaymentStatus;
  /** ISO 8601 timestamp of payment creation */
  createdAt: string;
  /** Additional metadata */
  metadata?: Record<string, string>;
  /** Client-safe payload (client_secret, orderId, redirectUrl, etc.) */
  clientPayload?: any;
}

/**
 * Result of a refund operation
 */
export interface RefundResult {
  /** Refund ID from the provider */
  refundId: string;
  /** Status of the refund */
  status: string;
  /** Amount refunded */
  amount?: number;
  /** Currency of the refund */
  currency?: string;
}

/**
 * Webhook verification result
 */
export interface WebhookVerificationResult {
  /** Whether the webhook signature is valid */
  valid: boolean;
  /** Parsed webhook event (if valid) */
  event?: any;
}

/**
 * Payment provider interface
 * All payment providers must implement this interface
 */
export interface PaymentProvider {
  /**
   * Create a new payment
   * @param input - Payment creation parameters
   * @returns Promise resolving to created payment
   */
  createPayment(input: CreatePaymentInput): Promise<Payment>;

  /**
   * Confirm a payment (for flows requiring client confirmation)
   * @param paymentId - SDK payment ID or provider payment ID
   * @param clientData - Additional client data for confirmation
   * @returns Promise resolving to confirmed payment
   */
  confirmPayment(paymentId: string, clientData?: any): Promise<Payment>;

  /**
   * Capture a previously authorized payment
   * @param paymentId - SDK payment ID or provider payment ID
   * @param amount - Optional amount to capture (defaults to full amount)
   * @returns Promise resolving to captured payment
   */
  capturePayment(paymentId: string, amount?: number): Promise<Payment>;

  /**
   * Refund a payment
   * @param paymentId - SDK payment ID or provider payment ID
   * @param amount - Optional amount to refund (defaults to full amount)
   * @returns Promise resolving to refund result
   */
  refundPayment(paymentId: string, amount?: number): Promise<RefundResult>;

  /**
   * Get payment details
   * @param paymentId - SDK payment ID or provider payment ID
   * @returns Promise resolving to payment details
   */
  getPayment(paymentId: string): Promise<Payment>;

  /**
   * Verify webhook signature (optional)
   * @param headers - HTTP headers from webhook request
   * @param rawBody - Raw request body as string
   * @returns Promise resolving to verification result
   */
  verifyWebhook?(headers: Record<string, string>, rawBody: string): Promise<WebhookVerificationResult>;
}

/**
 * Adapter factory function type
 */
export type AdapterFactory = (config: any) => PaymentProvider;

/**
 * Configuration for PaymentClient
 */
export interface PaymentClientConfig {
  /** Provider name (stripe, razorpay, paypal) */
  provider: string;
  /** Provider-specific configuration */
  config: any;
  /** Optional retry configuration */
  retry?: RetryConfig;
  /** Optional timeout in milliseconds */
  timeout?: number;
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  /** Maximum number of retries */
  maxRetries?: number;
  /** Base delay in milliseconds */
  baseDelayMs?: number;
  /** Maximum delay in milliseconds */
  maxDelayMs?: number;
}

/**
 * Options for payment operations
 */
export interface PaymentOperationOptions {
  /** Override provider for this operation */
  provider?: string;
  /** Custom timeout for this operation */
  timeout?: number;
  /** Idempotency key for create operations */
  idempotencyKey?: string;
  /** Retry configuration override */
  retry?: RetryConfig;
  /** Abort signal for cancellation */
  signal?: AbortSignal;
}
