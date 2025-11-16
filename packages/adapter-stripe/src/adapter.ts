/**
 * Stripe adapter implementation
 */

import Stripe from 'stripe';
import type {
  PaymentProvider,
  CreatePaymentInput,
  Payment,
  RefundResult,
  WebhookVerificationResult,
} from '@unipay/core';
import { PaymentOperationError } from '@unipay/core';
import { mapStripeStatus } from '@unipay/utils';

export interface StripeAdapterConfig {
  secretKey: string;
  apiVersion?: string;
  webhookSecret?: string;
}

/**
 * Stripe payment provider adapter
 */
export class StripeAdapter implements PaymentProvider {
  private stripe: Stripe;
  private webhookSecret?: string;

  constructor(config: StripeAdapterConfig) {
    if (!config.secretKey) {
      throw new Error('Stripe secret key is required');
    }

    this.stripe = new Stripe(config.secretKey, {
      apiVersion: '2023-10-16',
      typescript: true,
    });

    this.webhookSecret = config.webhookSecret;
  }

  /**
   * Extract provider payment ID from SDK ID
   */
  private extractPaymentId(paymentId: string): string {
    // SDK ID format: stripe_<id>
    if (paymentId.startsWith('stripe_')) {
      return paymentId.replace('stripe_', '');
    }
    return paymentId;
  }

  /**
   * Normalize Stripe PaymentIntent to SDK Payment
   */
  private normalizePayment(pi: Stripe.PaymentIntent): Payment {
    return {
      id: `stripe_${pi.id}`,
      provider: 'stripe',
      providerPaymentId: pi.id,
      amount: pi.amount,
      currency: pi.currency,
      status: mapStripeStatus(pi.status),
      createdAt: new Date(pi.created * 1000).toISOString(),
      metadata: pi.metadata as Record<string, string>,
      clientPayload: {
        clientSecret: pi.client_secret,
      },
    };
  }

  /**
   * Create a payment
   */
  async createPayment(input: CreatePaymentInput): Promise<Payment> {
    try {
      const params: Stripe.PaymentIntentCreateParams = {
        amount: input.amount,
        currency: input.currency.toLowerCase(),
        description: input.description,
        metadata: input.metadata,
        customer: input.customerId,
        capture_method: input.capture === false ? 'manual' : 'automatic',
      };

      if (input.paymentMethodTypes && input.paymentMethodTypes.length > 0) {
        params.payment_method_types = input.paymentMethodTypes as any[];
      }

      if (input.returnUrl) {
        params.return_url = input.returnUrl;
      }

      const paymentIntent = await this.stripe.paymentIntents.create(params);
      return this.normalizePayment(paymentIntent);
    } catch (error) {
      throw new PaymentOperationError(
        error instanceof Error ? error.message : 'Failed to create payment',
        'createPayment',
        (error as any).statusCode,
        'stripe'
      );
    }
  }

  /**
   * Confirm a payment
   */
  async confirmPayment(paymentId: string, clientData?: any): Promise<Payment> {
    try {
      const id = this.extractPaymentId(paymentId);
      const params: Stripe.PaymentIntentConfirmParams = {};

      if (clientData?.paymentMethod) {
        params.payment_method = clientData.paymentMethod;
      }

      if (clientData?.returnUrl) {
        params.return_url = clientData.returnUrl;
      }

      const paymentIntent = await this.stripe.paymentIntents.confirm(id, params);
      return this.normalizePayment(paymentIntent);
    } catch (error) {
      throw new PaymentOperationError(
        error instanceof Error ? error.message : 'Failed to confirm payment',
        'confirmPayment',
        (error as any).statusCode,
        'stripe'
      );
    }
  }

  /**
   * Capture a payment
   */
  async capturePayment(paymentId: string, amount?: number): Promise<Payment> {
    try {
      const id = this.extractPaymentId(paymentId);
      const params: Stripe.PaymentIntentCaptureParams = {};

      if (amount !== undefined) {
        params.amount_to_capture = amount;
      }

      const paymentIntent = await this.stripe.paymentIntents.capture(id, params);
      return this.normalizePayment(paymentIntent);
    } catch (error) {
      throw new PaymentOperationError(
        error instanceof Error ? error.message : 'Failed to capture payment',
        'capturePayment',
        (error as any).statusCode,
        'stripe'
      );
    }
  }

  /**
   * Refund a payment
   */
  async refundPayment(paymentId: string, amount?: number): Promise<RefundResult> {
    try {
      const id = this.extractPaymentId(paymentId);
      const params: Stripe.RefundCreateParams = {
        payment_intent: id,
      };

      if (amount !== undefined) {
        params.amount = amount;
      }

      const refund = await this.stripe.refunds.create(params);

      return {
        refundId: refund.id,
        status: refund.status,
        amount: refund.amount,
        currency: refund.currency,
      };
    } catch (error) {
      throw new PaymentOperationError(
        error instanceof Error ? error.message : 'Failed to refund payment',
        'refundPayment',
        (error as any).statusCode,
        'stripe'
      );
    }
  }

  /**
   * Get payment details
   */
  async getPayment(paymentId: string): Promise<Payment> {
    try {
      const id = this.extractPaymentId(paymentId);
      const paymentIntent = await this.stripe.paymentIntents.retrieve(id);
      return this.normalizePayment(paymentIntent);
    } catch (error) {
      throw new PaymentOperationError(
        error instanceof Error ? error.message : 'Failed to get payment',
        'getPayment',
        (error as any).statusCode,
        'stripe'
      );
    }
  }

  /**
   * Verify webhook signature
   */
  async verifyWebhook(
    headers: Record<string, string>,
    rawBody: string
  ): Promise<WebhookVerificationResult> {
    if (!this.webhookSecret) {
      throw new Error('Webhook secret not configured');
    }

    try {
      const signature = headers['stripe-signature'] || headers['Stripe-Signature'];

      if (!signature) {
        return { valid: false };
      }

      const event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.webhookSecret
      );

      return {
        valid: true,
        event: event,
      };
    } catch (error) {
      return {
        valid: false,
      };
    }
  }
}

/**
 * Create a Stripe adapter instance
 * @param config - Stripe configuration
 * @returns Stripe adapter instance
 */
export function createStripeAdapter(config: StripeAdapterConfig): StripeAdapter {
  return new StripeAdapter(config);
}
