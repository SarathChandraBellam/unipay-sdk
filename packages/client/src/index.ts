/**
 * @unipay/client - Browser-safe helpers for UniPay SDK
 *
 * No secrets, no server code - safe for browser use
 */

/**
 * Stripe.js helper
 * Feed it the clientSecret from Payment.clientPayload
 */
export interface StripeHelper {
  clientSecret: string;
  returnUrl?: string;
}

/**
 * Initialize Stripe.js flow
 * @param options - Stripe helper options
 * @returns Helper object for Stripe.js integration
 */
export function initializeStripePayment(options: StripeHelper) {
  return {
    clientSecret: options.clientSecret,
    confirmPayment: async (stripe: any, elements: any) => {
      if (typeof window === 'undefined') {
        throw new Error('Stripe.js can only be used in browser environment');
      }

      return stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: options.returnUrl || window.location.href,
        },
      });
    },
  };
}

/**
 * Razorpay Checkout helper
 * Accept orderId from Payment.clientPayload
 */
export interface RazorpayHelper {
  orderId: string;
  amount: number;
  currency: string;
  name?: string;
  description?: string;
  image?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
}

/**
 * Initialize Razorpay Checkout
 * @param keyId - Razorpay public key ID
 * @param options - Razorpay helper options
 * @param onSuccess - Success callback
 * @param onError - Error callback
 */
export function initializeRazorpayPayment(
  keyId: string,
  options: RazorpayHelper,
  onSuccess: (response: any) => void,
  onError: (error: any) => void
) {
  if (typeof window === 'undefined') {
    throw new Error('Razorpay Checkout can only be used in browser environment');
  }

  if (!(window as any).Razorpay) {
    throw new Error('Razorpay script not loaded. Include https://checkout.razorpay.com/v1/checkout.js');
  }

  const rzp = new (window as any).Razorpay({
    key: keyId,
    order_id: options.orderId,
    amount: options.amount,
    currency: options.currency,
    name: options.name || 'Payment',
    description: options.description,
    image: options.image,
    prefill: options.prefill,
    theme: options.theme,
    handler: onSuccess,
    modal: {
      ondismiss: () => onError(new Error('Payment cancelled by user')),
    },
  });

  return {
    open: () => rzp.open(),
    close: () => rzp.close(),
  };
}

/**
 * PayPal helper
 * Redirect to PayPal approval URL
 */
export interface PayPalHelper {
  approveUrl: string;
}

/**
 * Redirect to PayPal approval page
 * @param options - PayPal helper options
 */
export function redirectToPayPal(options: PayPalHelper) {
  if (typeof window === 'undefined') {
    throw new Error('PayPal redirect can only be used in browser environment');
  }

  window.location.href = options.approveUrl;
}

/**
 * Generic payment initializer that routes to provider-specific helper
 */
export function initializePayment(
  provider: string,
  clientPayload: any,
  config?: any
) {
  switch (provider.toLowerCase()) {
    case 'stripe':
      return initializeStripePayment({
        clientSecret: clientPayload.clientSecret,
        returnUrl: config?.returnUrl,
      });

    case 'razorpay':
      if (!config?.keyId) {
        throw new Error('Razorpay keyId required in config');
      }
      return initializeRazorpayPayment(
        config.keyId,
        {
          orderId: clientPayload.orderId,
          amount: clientPayload.amount,
          currency: clientPayload.currency,
          ...config,
        },
        config.onSuccess || (() => {}),
        config.onError || (() => {})
      );

    case 'paypal':
      return redirectToPayPal({
        approveUrl: clientPayload.approveUrl,
      });

    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}
