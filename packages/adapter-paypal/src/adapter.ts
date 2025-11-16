/**
 * PayPal adapter implementation using undici
 */

import { request, Agent } from 'undici';
import type {
  PaymentProvider,
  CreatePaymentInput,
  Payment,
  RefundResult,
  WebhookVerificationResult,
} from '@unipay/core';
import { PaymentOperationError } from '@unipay/core';
import { mapPayPalStatus } from '@unipay/utils';

export interface PayPalAdapterConfig {
  clientId: string;
  clientSecret: string;
  mode?: 'sandbox' | 'live';
  webhookId?: string;
}

/**
 * PayPal payment provider adapter
 */
export class PayPalAdapter implements PaymentProvider {
  private clientId: string;
  private clientSecret: string;
  private baseUrl: string;
  private webhookId?: string;
  private agent: Agent;
  private accessToken?: string;
  private tokenExpiry?: number;

  constructor(config: PayPalAdapterConfig) {
    if (!config.clientId || !config.clientSecret) {
      throw new Error('PayPal client ID and secret are required');
    }

    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.webhookId = config.webhookId;
    this.baseUrl =
      config.mode === 'live'
        ? 'https://api-m.paypal.com'
        : 'https://api-m.sandbox.paypal.com';

    // Reuse HTTP agent for connection pooling
    this.agent = new Agent({
      keepAliveTimeout: 60000,
      keepAliveMaxTimeout: 600000,
    });
  }

  /**
   * Get access token (cached)
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

    const response = await request(`${this.baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
      dispatcher: this.agent,
    });

    if (response.statusCode !== 200) {
      throw new Error('Failed to get PayPal access token');
    }

    const data: any = await response.body.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000; // Refresh 1 min early

    return this.accessToken;
  }

  /**
   * Make authenticated API request
   */
  private async apiRequest(
    path: string,
    method: string,
    body?: any
  ): Promise<any> {
    const token = await this.getAccessToken();

    const response = await request(`${this.baseUrl}${path}`, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
      dispatcher: this.agent,
    });

    const responseData: any = await response.body.json();

    if (response.statusCode >= 400) {
      throw new Error(
        responseData.message || `PayPal API error: ${response.statusCode}`
      );
    }

    return responseData;
  }

  /**
   * Extract provider payment ID from SDK ID
   */
  private extractPaymentId(paymentId: string): string {
    if (paymentId.startsWith('paypal_')) {
      return paymentId.replace('paypal_', '');
    }
    return paymentId;
  }

  /**
   * Normalize PayPal order to SDK Payment
   */
  private normalizePayment(order: any): Payment {
    const purchaseUnit = order.purchase_units?.[0];
    const amount = purchaseUnit?.amount;

    return {
      id: `paypal_${order.id}`,
      provider: 'paypal',
      providerPaymentId: order.id,
      amount: amount ? parseInt((parseFloat(amount.value) * 100).toFixed(0)) : 0,
      currency: amount?.currency_code || 'USD',
      status: mapPayPalStatus(order.status),
      createdAt: order.create_time || new Date().toISOString(),
      metadata: {},
      clientPayload: {
        orderId: order.id,
        approveUrl: order.links?.find((l: any) => l.rel === 'approve')?.href,
      },
    };
  }

  /**
   * Create a payment (creates PayPal order)
   */
  async createPayment(input: CreatePaymentInput): Promise<Payment> {
    try {
      const order = await this.apiRequest('/v2/checkout/orders', 'POST', {
        intent: input.capture === false ? 'AUTHORIZE' : 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: input.currency.toUpperCase(),
              value: (input.amount / 100).toFixed(2),
            },
            description: input.description,
          },
        ],
        application_context: input.returnUrl
          ? {
              return_url: input.returnUrl,
              cancel_url: input.returnUrl,
            }
          : undefined,
      });

      return this.normalizePayment(order);
    } catch (error) {
      throw new PaymentOperationError(
        error instanceof Error ? error.message : 'Failed to create payment',
        'createPayment',
        undefined,
        'paypal'
      );
    }
  }

  /**
   * Confirm a payment (not applicable for PayPal - returns order details)
   */
  async confirmPayment(paymentId: string): Promise<Payment> {
    return this.getPayment(paymentId);
  }

  /**
   * Capture a payment
   */
  async capturePayment(paymentId: string): Promise<Payment> {
    try {
      const id = this.extractPaymentId(paymentId);
      const result = await this.apiRequest(
        `/v2/checkout/orders/${id}/capture`,
        'POST'
      );

      return this.normalizePayment(result);
    } catch (error) {
      throw new PaymentOperationError(
        error instanceof Error ? error.message : 'Failed to capture payment',
        'capturePayment',
        undefined,
        'paypal'
      );
    }
  }

  /**
   * Refund a payment
   */
  async refundPayment(paymentId: string, amount?: number): Promise<RefundResult> {
    try {
      const id = this.extractPaymentId(paymentId);

      // Get order to find capture ID
      const order = await this.apiRequest(`/v2/checkout/orders/${id}`, 'GET');
      const captureId =
        order.purchase_units?.[0]?.payments?.captures?.[0]?.id;

      if (!captureId) {
        throw new Error('No capture found for this order');
      }

      const refundBody: any = {};
      if (amount !== undefined) {
        const currency = order.purchase_units?.[0]?.amount?.currency_code || 'USD';
        refundBody.amount = {
          currency_code: currency,
          value: (amount / 100).toFixed(2),
        };
      }

      const refund = await this.apiRequest(
        `/v2/payments/captures/${captureId}/refund`,
        'POST',
        refundBody
      );

      return {
        refundId: refund.id,
        status: refund.status,
        amount: refund.amount
          ? parseInt((parseFloat(refund.amount.value) * 100).toFixed(0))
          : undefined,
        currency: refund.amount?.currency_code,
      };
    } catch (error) {
      throw new PaymentOperationError(
        error instanceof Error ? error.message : 'Failed to refund payment',
        'refundPayment',
        undefined,
        'paypal'
      );
    }
  }

  /**
   * Get payment details
   */
  async getPayment(paymentId: string): Promise<Payment> {
    try {
      const id = this.extractPaymentId(paymentId);
      const order = await this.apiRequest(`/v2/checkout/orders/${id}`, 'GET');
      return this.normalizePayment(order);
    } catch (error) {
      throw new PaymentOperationError(
        error instanceof Error ? error.message : 'Failed to get payment',
        'getPayment',
        undefined,
        'paypal'
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
    if (!this.webhookId) {
      throw new Error('Webhook ID not configured');
    }

    try {
      // PayPal webhook verification requires calling their API
      const transmissionId = headers['paypal-transmission-id'];
      const transmissionTime = headers['paypal-transmission-time'];
      const certUrl = headers['paypal-cert-url'];
      const transmissionSig = headers['paypal-transmission-sig'];
      const authAlgo = headers['paypal-auth-algo'];

      if (!transmissionId || !transmissionTime || !certUrl || !transmissionSig) {
        return { valid: false };
      }

      const event = JSON.parse(rawBody);

      // Call PayPal's verification endpoint
      const result = await this.apiRequest(
        '/v1/notifications/verify-webhook-signature',
        'POST',
        {
          transmission_id: transmissionId,
          transmission_time: transmissionTime,
          cert_url: certUrl,
          auth_algo: authAlgo,
          transmission_sig: transmissionSig,
          webhook_id: this.webhookId,
          webhook_event: event,
        }
      );

      const valid = result.verification_status === 'SUCCESS';
      return {
        valid,
        event: valid ? event : undefined,
      };
    } catch (error) {
      return { valid: false };
    }
  }
}

/**
 * Create a PayPal adapter instance
 */
export function createPayPalAdapter(config: PayPalAdapterConfig): PayPalAdapter {
  return new PayPalAdapter(config);
}
