/**
 * Razorpay adapter implementation
 */

import Razorpay from 'razorpay';
import type {
  PaymentProvider,
  CreatePaymentInput,
  Payment,
  RefundResult,
  WebhookVerificationResult,
} from '@unipay/core';
import { PaymentOperationError } from '@unipay/core';
import { mapRazorpayStatus, verifyRazorpaySignature } from '@unipay/utils';

export interface RazorpayAdapterConfig {
  keyId: string;
  keySecret: string;
  webhookSecret?: string;
}

/**
 * Razorpay payment provider adapter
 */
export class RazorpayAdapter implements PaymentProvider {
  private razorpay: Razorpay;
  private webhookSecret?: string;

  constructor(config: RazorpayAdapterConfig) {
    if (!config.keyId || !config.keySecret) {
      throw new Error('Razorpay key ID and secret are required');
    }

    this.razorpay = new Razorpay({
      key_id: config.keyId,
      key_secret: config.keySecret,
    });

    this.webhookSecret = config.webhookSecret;
  }

  /**
   * Extract provider payment ID from SDK ID
   */
  private extractPaymentId(paymentId: string): string {
    if (paymentId.startsWith('razorpay_')) {
      return paymentId.replace('razorpay_', '');
    }
    return paymentId;
  }

  /**
   * Normalize Razorpay order/payment to SDK Payment
   */
  private normalizePayment(data: any, type: 'order' | 'payment' = 'order'): Payment {
    if (type === 'order') {
      return {
        id: `razorpay_${data.id}`,
        provider: 'razorpay',
        providerPaymentId: data.id,
        amount: data.amount,
        currency: data.currency,
        status: mapRazorpayStatus(data.status),
        createdAt: new Date(data.created_at * 1000).toISOString(),
        metadata: data.notes as Record<string, string>,
        clientPayload: {
          orderId: data.id,
          amount: data.amount,
          currency: data.currency,
        },
      };
    } else {
      return {
        id: `razorpay_${data.id}`,
        provider: 'razorpay',
        providerPaymentId: data.id,
        amount: data.amount,
        currency: data.currency,
        status: mapRazorpayStatus(data.status, data.captured),
        createdAt: new Date(data.created_at * 1000).toISOString(),
        metadata: data.notes as Record<string, string>,
        clientPayload: {
          paymentId: data.id,
        },
      };
    }
  }

  /**
   * Create a payment (creates a Razorpay order)
   */
  async createPayment(input: CreatePaymentInput): Promise<Payment> {
    try {
      const order = await this.razorpay.orders.create({
        amount: input.amount,
        currency: input.currency,
        receipt: input.metadata?.receipt || `rcpt_${Date.now()}`,
        notes: input.metadata,
      });

      return this.normalizePayment(order, 'order');
    } catch (error) {
      throw new PaymentOperationError(
        error instanceof Error ? error.message : 'Failed to create payment',
        'createPayment',
        undefined,
        'razorpay'
      );
    }
  }

  /**
   * Confirm a payment (fetch payment details)
   */
  async confirmPayment(paymentId: string, clientData?: any): Promise<Payment> {
    try {
      const id = this.extractPaymentId(paymentId);
      const payment = await this.razorpay.payments.fetch(id);
      return this.normalizePayment(payment, 'payment');
    } catch (error) {
      throw new PaymentOperationError(
        error instanceof Error ? error.message : 'Failed to confirm payment',
        'confirmPayment',
        undefined,
        'razorpay'
      );
    }
  }

  /**
   * Capture a payment
   */
  async capturePayment(paymentId: string, amount?: number): Promise<Payment> {
    try {
      const id = this.extractPaymentId(paymentId);

      // Get current payment to determine amount if not provided
      const currentPayment = await this.razorpay.payments.fetch(id);
      const captureAmount = amount || currentPayment.amount;

      const payment = await this.razorpay.payments.capture(id, captureAmount, currentPayment.currency);
      return this.normalizePayment(payment, 'payment');
    } catch (error) {
      throw new PaymentOperationError(
        error instanceof Error ? error.message : 'Failed to capture payment',
        'capturePayment',
        undefined,
        'razorpay'
      );
    }
  }

  /**
   * Refund a payment
   */
  async refundPayment(paymentId: string, amount?: number): Promise<RefundResult> {
    try {
      const id = this.extractPaymentId(paymentId);
      const refundData: any = {
        payment_id: id,
      };

      if (amount !== undefined) {
        refundData.amount = amount;
      }

      const refund = await this.razorpay.refunds.create(refundData);

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
        undefined,
        'razorpay'
      );
    }
  }

  /**
   * Get payment details
   */
  async getPayment(paymentId: string): Promise<Payment> {
    try {
      const id = this.extractPaymentId(paymentId);

      // Try to fetch as payment first
      try {
        const payment = await this.razorpay.payments.fetch(id);
        return this.normalizePayment(payment, 'payment');
      } catch {
        // If not a payment, try as order
        const order = await this.razorpay.orders.fetch(id);
        return this.normalizePayment(order, 'order');
      }
    } catch (error) {
      throw new PaymentOperationError(
        error instanceof Error ? error.message : 'Failed to get payment',
        'getPayment',
        undefined,
        'razorpay'
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
      const signature =
        headers['x-razorpay-signature'] || headers['X-Razorpay-Signature'];

      if (!signature) {
        return { valid: false };
      }

      const valid = verifyRazorpaySignature(this.webhookSecret, rawBody, signature);

      if (valid) {
        const event = JSON.parse(rawBody);
        return { valid: true, event };
      }

      return { valid: false };
    } catch (error) {
      return { valid: false };
    }
  }
}

/**
 * Create a Razorpay adapter instance
 */
export function createRazorpayAdapter(config: RazorpayAdapterConfig): RazorpayAdapter {
  return new RazorpayAdapter(config);
}
