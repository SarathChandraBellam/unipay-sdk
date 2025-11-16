/**
 * Signature verification helpers for webhooks
 */

import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Verify Razorpay webhook signature (SHA256 HMAC)
 * @param webhookSecret - Webhook secret from Razorpay dashboard
 * @param rawBody - Raw request body
 * @param signature - Signature from X-Razorpay-Signature header
 * @returns True if signature is valid
 */
export function verifyRazorpaySignature(
  webhookSecret: string,
  rawBody: string,
  signature: string
): boolean {
  try {
    const expectedSignature = createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    // Use timing-safe comparison to prevent timing attacks
    return timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(signature)
    );
  } catch (error) {
    return false;
  }
}

/**
 * Verify Stripe webhook signature
 * This is a simplified wrapper - in practice, use stripe.webhooks.constructEvent
 * @param webhookSecret - Webhook secret from Stripe dashboard
 * @param rawBody - Raw request body
 * @param signatureHeader - Value from Stripe-Signature header
 * @param tolerance - Timestamp tolerance in seconds (default: 300)
 * @returns Object containing validity and parsed signature components
 */
export function verifyStripeSignature(
  webhookSecret: string,
  rawBody: string,
  signatureHeader: string,
  tolerance: number = 300
): { valid: boolean; timestamp?: number } {
  try {
    // Parse signature header: t=timestamp,v1=signature
    const signatures = signatureHeader.split(',').reduce((acc, pair) => {
      const [key, value] = pair.split('=');
      if (key && value) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, string>);

    const timestamp = parseInt(signatures.t || '0', 10);
    const signature = signatures.v1;

    if (!timestamp || !signature) {
      return { valid: false };
    }

    // Check timestamp tolerance
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestamp) > tolerance) {
      return { valid: false, timestamp };
    }

    // Compute expected signature
    const signedPayload = `${timestamp}.${rawBody}`;
    const expectedSignature = createHmac('sha256', webhookSecret)
      .update(signedPayload)
      .digest('hex');

    // Timing-safe comparison
    const valid = timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(signature)
    );

    return { valid, timestamp };
  } catch (error) {
    return { valid: false };
  }
}

/**
 * PayPal webhook verification
 * Note: Full PayPal verification requires calling their API or validating certificate
 * This is a placeholder for the signature validation logic
 * @param webhookId - Webhook ID from PayPal
 * @param transmissionId - From PayPal-Transmission-Id header
 * @param transmissionTime - From PayPal-Transmission-Time header
 * @param certUrl - From PayPal-Cert-Url header
 * @param transmissionSig - From PayPal-Transmission-Sig header
 * @param rawBody - Raw request body
 * @param webhookEvent - Parsed webhook event
 * @returns Promise resolving to verification result
 */
export async function verifyPayPalSignature(
  _webhookId: string,
  _transmissionId: string,
  _transmissionTime: string,
  _certUrl: string,
  _transmissionSig: string,
  _rawBody: string,
  _webhookEvent: any
): Promise<boolean> {
  // PayPal signature verification typically involves:
  // 1. Constructing expected message: webhook_id|transmission_time|transmission_id|crc32(body)|cert_url
  // 2. Verifying signature using PayPal's public certificate
  // 3. Or calling PayPal's /notifications/verify-webhook-signature endpoint
  //
  // For production use, recommend using PayPal's SDK or calling their verification endpoint
  // This is a placeholder implementation

  try {
    // In a real implementation, you would:
    // 1. Fetch and validate the certificate from certUrl
    // 2. Construct the expected message
    // 3. Verify the signature using the certificate's public key
    //
    // For now, we'll just return true as a placeholder
    // TODO: Implement full PayPal signature verification
    console.warn('PayPal signature verification not fully implemented - using placeholder');
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Create CRC32 checksum (used by PayPal)
 * @param str - String to checksum
 * @returns CRC32 checksum
 */
export function crc32(str: string): number {
  const table: number[] = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c;
  }

  let crc = 0 ^ -1;
  for (let i = 0; i < str.length; i++) {
    crc = (crc >>> 8) ^ (table[(crc ^ str.charCodeAt(i)) & 0xff] ?? 0);
  }

  return (crc ^ -1) >>> 0;
}
