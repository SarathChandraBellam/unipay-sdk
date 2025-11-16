/**
 * PaymentClient - Main entry point for UniPay SDK
 */

import type {
  PaymentProvider,
  PaymentClientConfig,
  CreatePaymentInput,
  Payment,
  RefundResult,
  WebhookVerificationResult,
  PaymentOperationOptions,
} from './types.js';
import { createProvider } from './registry.js';
import { TimeoutError, AbortError } from './errors.js';

/**
 * Main payment client class
 * Provides a unified interface for payment operations across providers
 */
export class PaymentClient {
  private provider?: PaymentProvider;
  private readonly config: PaymentClientConfig;

  /**
   * Create a new PaymentClient
   * @param config - Client configuration
   */
  constructor(config: PaymentClientConfig) {
    this.config = config;
  }

  /**
   * Get or create the provider instance (lazy initialization)
   */
  private getProvider(providerName?: string): PaymentProvider {
    const name = providerName || this.config.provider;

    // If provider name differs from config, create a new instance
    if (providerName && providerName !== this.config.provider) {
      return createProvider(name, this.config.config);
    }

    // Lazy initialization
    if (!this.provider) {
      this.provider = createProvider(name, this.config.config);
    }

    return this.provider;
  }

  /**
   * Wrap an operation with timeout and abort signal support
   */
  private async withTimeout<T>(
    operation: (signal?: AbortSignal) => Promise<T>,
    options?: PaymentOperationOptions
  ): Promise<T> {
    const timeout = options?.timeout || this.config.timeout;
    const signal = options?.signal;

    if (!timeout && !signal) {
      return operation(signal);
    }

    const controller = new AbortController();
    const combinedSignal = signal
      ? this.combineSignals([signal, controller.signal])
      : controller.signal;

    let timeoutId: NodeJS.Timeout | undefined;

    try {
      const promise = operation(combinedSignal);

      if (timeout) {
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => {
            controller.abort();
            reject(new TimeoutError(`Operation timed out after ${timeout}ms`, timeout));
          }, timeout);
        });

        return await Promise.race([promise, timeoutPromise]);
      }

      return await promise;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new AbortError('Operation was aborted');
      }
      throw error;
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }

  /**
   * Combine multiple abort signals
   */
  private combineSignals(signals: AbortSignal[]): AbortSignal {
    const controller = new AbortController();

    for (const signal of signals) {
      if (signal.aborted) {
        controller.abort();
        break;
      }
      signal.addEventListener('abort', () => controller.abort(), { once: true });
    }

    return controller.signal;
  }

  /**
   * Create a new payment
   * @param input - Payment creation parameters
   * @param options - Operation options
   * @returns Promise resolving to created payment
   */
  async createPayment(
    input: CreatePaymentInput,
    options?: PaymentOperationOptions
  ): Promise<Payment> {
    const provider = this.getProvider(options?.provider);
    return this.withTimeout(() => provider.createPayment(input), options);
  }

  /**
   * Confirm a payment
   * @param paymentId - Payment ID
   * @param clientData - Additional client data
   * @param options - Operation options
   * @returns Promise resolving to confirmed payment
   */
  async confirmPayment(
    paymentId: string,
    clientData?: any,
    options?: PaymentOperationOptions
  ): Promise<Payment> {
    const provider = this.getProvider(options?.provider);
    return this.withTimeout(() => provider.confirmPayment(paymentId, clientData), options);
  }

  /**
   * Capture a payment
   * @param paymentId - Payment ID
   * @param amount - Optional amount to capture
   * @param options - Operation options
   * @returns Promise resolving to captured payment
   */
  async capturePayment(
    paymentId: string,
    amount?: number,
    options?: PaymentOperationOptions
  ): Promise<Payment> {
    const provider = this.getProvider(options?.provider);
    return this.withTimeout(() => provider.capturePayment(paymentId, amount), options);
  }

  /**
   * Refund a payment
   * @param paymentId - Payment ID
   * @param amount - Optional amount to refund
   * @param options - Operation options
   * @returns Promise resolving to refund result
   */
  async refundPayment(
    paymentId: string,
    amount?: number,
    options?: PaymentOperationOptions
  ): Promise<RefundResult> {
    const provider = this.getProvider(options?.provider);
    return this.withTimeout(() => provider.refundPayment(paymentId, amount), options);
  }

  /**
   * Get payment details
   * @param paymentId - Payment ID
   * @param options - Operation options
   * @returns Promise resolving to payment details
   */
  async getPayment(paymentId: string, options?: PaymentOperationOptions): Promise<Payment> {
    const provider = this.getProvider(options?.provider);
    return this.withTimeout(() => provider.getPayment(paymentId), options);
  }

  /**
   * Verify webhook signature
   * @param headers - HTTP headers
   * @param rawBody - Raw request body
   * @param options - Operation options
   * @returns Promise resolving to verification result
   */
  async verifyWebhook(
    headers: Record<string, string>,
    rawBody: string,
    options?: PaymentOperationOptions
  ): Promise<WebhookVerificationResult> {
    const provider = this.getProvider(options?.provider);

    if (!provider.verifyWebhook) {
      throw new Error('Webhook verification not supported by this provider');
    }

    return this.withTimeout(() => provider.verifyWebhook!(headers, rawBody), options);
  }
}
