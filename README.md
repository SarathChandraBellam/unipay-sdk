# UniPay SDK

> A pure, modular, high-performance TypeScript payments SDK that unifies Stripe, Razorpay, and PayPal.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-%3E%3D18.0.0-green.svg)](https://nodejs.org/)

## Features

- **🎯 Unified API** - Single interface for Stripe, Razorpay, and PayPal
- **🔒 Type-Safe** - Written in TypeScript with strict mode
- **⚡ High Performance** - Async, non-blocking, low-latency operations
- **🧩 Modular** - Use only the adapters you need
- **🌐 Universal** - Works in Node.js and browsers (with separate packages)
- **🔄 Retry Logic** - Built-in exponential backoff with jitter
- **🔑 Idempotency** - Automatic idempotency key management
- **✅ Webhook Verification** - Signature verification for all providers
- **📦 Tree-Shakeable** - ESM and CJS builds

## Installation

```bash
# Install core package
npm install @unipay/core

# Install adapters you need
npm install @unipay/adapter-stripe
npm install @unipay/adapter-razorpay
npm install @unipay/adapter-paypal

# Optional: Browser helpers
npm install @unipay/client
```

## Quick Start

### Basic Usage

```typescript
import { PaymentClient } from '@unipay/core';
import '@unipay/adapter-stripe/register'; // Auto-registers Stripe adapter

const client = new PaymentClient({
  provider: 'stripe',
  config: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET
  }
});

// Create a payment
const payment = await client.createPayment({
  amount: 1000, // Amount in cents
  currency: 'USD',
  description: 'Test payment',
  metadata: { orderId: '12345' }
});

console.log(payment.id); // stripe_pi_xxx
console.log(payment.status); // 'created', 'succeeded', etc.
console.log(payment.clientPayload.clientSecret); // For client-side confirmation
```

### Using Multiple Providers

```typescript
import { PaymentClient } from '@unipay/core';
import '@unipay/adapter-stripe/register';
import '@unipay/adapter-razorpay/register';
import '@unipay/adapter-paypal/register';

// Stripe client
const stripeClient = new PaymentClient({
  provider: 'stripe',
  config: { secretKey: process.env.STRIPE_SECRET_KEY }
});

// Razorpay client
const razorpayClient = new PaymentClient({
  provider: 'razorpay',
  config: {
    keyId: process.env.RAZORPAY_KEY_ID,
    keySecret: process.env.RAZORPAY_KEY_SECRET
  }
});

// PayPal client
const paypalClient = new PaymentClient({
  provider: 'paypal',
  config: {
    clientId: process.env.PAYPAL_CLIENT_ID,
    clientSecret: process.env.PAYPAL_CLIENT_SECRET,
    mode: 'sandbox' // or 'live'
  }
});
```

### Payment Operations

```typescript
// Create a payment
const payment = await client.createPayment({
  amount: 2000,
  currency: 'USD',
  capture: false, // Manual capture
});

// Capture a payment
const captured = await client.capturePayment(payment.id);

// Refund a payment
const refund = await client.refundPayment(payment.id, 1000); // Partial refund

// Get payment details
const details = await client.getPayment(payment.id);
```

### Webhook Verification

```typescript
import { PaymentClient } from '@unipay/core';
import '@unipay/adapter-stripe/register';

const client = new PaymentClient({
  provider: 'stripe',
  config: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET
  }
});

// In your webhook handler
app.post('/webhook', async (req, res) => {
  const signature = req.headers['stripe-signature'];
  const rawBody = req.body; // Must be raw body string

  const result = await client.verifyWebhook(
    { 'stripe-signature': signature },
    rawBody
  );

  if (result.valid) {
    console.log('Webhook event:', result.event);
    // Process the event
  } else {
    res.status(400).send('Invalid signature');
    return;
  }

  res.json({ received: true });
});
```

### Browser Usage

```typescript
import { initializeStripePayment } from '@unipay/client';

// Get payment from server
const response = await fetch('/api/create-payment', { method: 'POST' });
const payment = await response.json();

// Initialize Stripe.js
const stripe = Stripe('pk_test_xxx');
const elements = stripe.elements();

// Use SDK helper
const helper = initializeStripePayment({
  clientSecret: payment.clientPayload.clientSecret,
  returnUrl: window.location.href
});

// Confirm payment
await helper.confirmPayment(stripe, elements);
```

### Advanced Options

```typescript
// With timeout and retry configuration
const payment = await client.createPayment(
  {
    amount: 5000,
    currency: 'USD',
  },
  {
    timeout: 10000, // 10 second timeout
    retry: {
      maxRetries: 3,
      baseDelayMs: 100,
      maxDelayMs: 5000,
    },
    idempotencyKey: 'custom-idempotency-key',
  }
);

// With abort signal
const controller = new AbortController();
const payment = await client.createPayment(
  { amount: 1000, currency: 'USD' },
  { signal: controller.signal }
);

// Cancel the request
controller.abort();
```

## Package Structure

This is a monorepo with multiple packages:

| Package | Description |
|---------|-------------|
| `@unipay/core` | Core SDK with unified API and types |
| `@unipay/utils` | Shared utilities (retry, idempotency, etc.) |
| `@unipay/adapter-stripe` | Stripe adapter |
| `@unipay/adapter-razorpay` | Razorpay adapter |
| `@unipay/adapter-paypal` | PayPal adapter |
| `@unipay/client` | Browser-safe client helpers |

## Provider-Specific Details

### Stripe

- Uses official Stripe Node SDK
- Supports all PaymentIntent operations
- Webhook verification with `stripe.webhooks.constructEvent`
- Automatic idempotency key handling

### Razorpay

- Uses official Razorpay Node SDK
- Creates orders (not direct payments)
- SHA256 HMAC webhook verification
- Supports manual and automatic capture

### PayPal

- Uses PayPal REST API v2 via undici
- Efficient HTTP agent reuse
- OAuth 2.0 token caching
- Webhook verification via PayPal API

## Development

### Prerequisites

- Node.js 18+
- npm 9+

### Setup

```bash
# Clone the repository
git clone https://github.com/SarathChandraBellam/unipay-sdk.git
cd unipay-sdk

# Install dependencies
npm install

# Build all packages
npm run build

# Run tests
npm test

# Run linter
npm run lint
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Building

```bash
# Build all packages
npm run build

# Build specific package
cd packages/core && npm run build
```

## Adding a New Provider

See [ADAPTER_TEMPLATE.md](./ADAPTER_TEMPLATE.md) for detailed instructions on creating a new payment provider adapter.

## API Documentation

### PaymentClient

Main client for payment operations.

#### Constructor

```typescript
new PaymentClient(config: PaymentClientConfig)
```

#### Methods

- `createPayment(input, options?)` - Create a new payment
- `confirmPayment(paymentId, clientData?, options?)` - Confirm a payment
- `capturePayment(paymentId, amount?, options?)` - Capture a payment
- `refundPayment(paymentId, amount?, options?)` - Refund a payment
- `getPayment(paymentId, options?)` - Get payment details
- `verifyWebhook(headers, rawBody, options?)` - Verify webhook signature

### Types

See [packages/core/src/types.ts](./packages/core/src/types.ts) for complete type definitions.

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

## License

MIT © [Sarath Chandra Bellam](https://github.com/SarathChandraBellam)

## Support

- [Report Issues](https://github.com/SarathChandraBellam/unipay-sdk/issues)
- [Request Features](https://github.com/SarathChandraBellam/unipay-sdk/issues/new)
- [Discussions](https://github.com/SarathChandraBellam/unipay-sdk/discussions)

## Roadmap

- [ ] Additional provider support (Square, Adyen, etc.)
- [ ] Subscription management
- [ ] Customer management APIs
- [ ] Payment method management
- [ ] Dispute handling
- [ ] Advanced analytics and reporting
- [ ] CLI tool for testing
- [ ] Postman/OpenAPI collections

---

**Made with ❤️ for the developer community**
