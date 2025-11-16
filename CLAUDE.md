# CLAUDE.md

> Implementation brief for Codex: build **unipay-sdk**, a pure, modular, high-performance TypeScript payments SDK that unifies Stripe, Razorpay and PayPal.
> No HTTP server code. No routing. Pure SDK modules only — importable into any app.

---

## 1 — Goal (short)

Create a **pure SDK** (TypeScript, Node 18+) that provides a provider-agnostic API for payment operations. Modular adapters (stripe, razorpay, paypal) translate provider APIs into a single normalized shape. Everything must be async, non-blocking, low-latency, and easy to extend.

---

## 2 — Tech requirements

- Runtime: **Node 18+**
- Language: **TypeScript** (strict mode)
- Package manager: **npm workspaces**
- No HTTP servers, no route handlers, no Fastify/Express
- All code async / non-blocking
- Use **undici** for outbound HTTP requests where applicable
- Produce **ESM + CJS** builds
- Lint: **ESLint** (TypeScript rules)
- Format: **Prettier**
- Tests: **Jest** or **Vitest**
- Bundle/build: **tsup** or **esbuild** (fast)
- Provide `.d.ts` type declarations

---

## 3 — Repo structure

```
/payments-sdk
  /packages
    /core             # unified API, types, base classes, adapter registry
    /adapter-stripe   # stripe implementation
    /adapter-razorpay
    /adapter-paypal
    /utils            # shared utilities: idempotency, retry, signature-verify
    /client           # browser-safe helpers only
  package.json        # npm workspaces
  README.md
  CLAUDE.md           # this file
```

---

## 4 — Core requirements (`packages/core`)

### 4.1 Types & interface (must exist exactly / strongly typed)

Implement and export the following in `core/src/types.ts`:

```ts
export interface CreatePaymentInput {
  amount: number; // smallest unit
  currency: string;
  description?: string;
  metadata?: Record<string, string>;
  customerId?: string;
  capture?: boolean;
  paymentMethodTypes?: string[];
  returnUrl?: string;
  appId?: string;
}

export type PaymentStatus =
  | 'created'
  | 'requires_action'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'captured'
  | 'refunded';

export interface Payment {
  id: string; // sdk id: <provider>_<nativeId>
  provider: string;
  providerPaymentId?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  createdAt: string;
  metadata?: Record<string, string>;
  clientPayload?: any; // secretsafe: client_secret, orderId, redirectUrl
}

export interface PaymentProvider {
  createPayment(input: CreatePaymentInput): Promise<Payment>;
  confirmPayment(paymentId: string, clientData?: any): Promise<Payment>;
  capturePayment(paymentId: string, amount?: number): Promise<Payment>;
  refundPayment(paymentId: string, amount?: number): Promise<{ refundId: string; status: string }>;
  getPayment(paymentId: string): Promise<Payment>;
  verifyWebhook?(
    headers: Record<string, string>,
    rawBody: string
  ): Promise<{ valid: boolean; event?: any }>;
}
```

### 4.2 Adapter registry & client

- `registerAdapter(name: string, adapterFactory: (...args) => PaymentProvider)` — allow late registration.
- `getAdapter(name: string): PaymentProvider | undefined`.
- `PaymentClient` class:
  - Construct with `{ provider: string, config: any }`.
  - Resolve adapter lazily on first call.
  - Wrap adapter calls with configurable retry, timeout, idempotency helpers.
  - Provide per-call overrides: e.g. `client.createPayment(input, { provider?, timeout?, idempotencyKey? })`.
  - Expose typed errors and events where appropriate.

### 4.3 Performance rules (core-level guarantees)

- All SDK calls must be non-blocking and Promise-based.
- Use **undici** for HTTP calls (paypal, razorpay if SDKless).
- Reuse and cache HTTP agent(s) — no new agent per call.
- Support AbortController per-request.
- Provide exponential-backoff retry helper (with jitter).
- Map provider errors to typed SDK errors (no blocking transforms).

---

## 5 — Adapter implementation requirements

Adapters live under `/packages/adapter-<provider>` and implement `PaymentProvider`.

### 5.1 `adapter-stripe`

- Use official `stripe` Node SDK.
- Implement: `createPayment`, `confirmPayment`, `capturePayment`, `refundPayment`, `getPayment`.
- Use idempotency keys for create operations when supported.
- Normalize `PaymentIntent` (and associated `Charge`) to `Payment`.
- Implement webhook verification using `stripe.webhooks.constructEvent` (exposed as `verifyWebhook`).
- Adapter must be pure functions/classes — no server code.

### 5.2 `adapter-razorpay`

- Prefer official Razorpay SDK; if too slow, use undici raw calls.
- Implement: create order, capture payment, refund, get payment.
- Implement webhook signature verification (SHA256 HMAC).
- Normalize Razorpay objects → `Payment`.

### 5.3 `adapter-paypal`

- Use raw REST API via **undici**.
- Implement: create payment (v2 payment/capture flow), capture, refund, get.
- Implement PayPal webhook signature verification logic per PayPal docs (certificate-based).
- Normalize PayPal objects → `Payment`.

---

## 6 — Utilities (`packages/utils`)

Implement small, well-tested helpers used by core and adapters.

### 6.1 Retry helper

- Exponential backoff + full jitter.
- Async-friendly.
- Configurable: `maxRetries`, `baseDelayMs`, `maxDelayMs`, `timeoutMs`.
- Accepts optional AbortSignal.

### 6.2 Idempotency helper

- Generate UUID-based idempotency keys.
- Provide helper to attach provider-specific idempotency headers.

### 6.3 Signature verification helpers

- Stripe: wrapper that accepts `stripeWebhookSecret`, `headers`, `rawBody` and calls stripe verification.
- Razorpay: SHA256 HMAC verification helper.
- PayPal: verify using PayPal's verification approach (use undici to call /webhooks/verify-signature when necessary, or implement local certificate verification if feasible).

### 6.4 Status mappers

- `mapStripeStatus(piStatus: string | unknown): PaymentStatus`
- `mapRazorpayStatus(x: any): PaymentStatus`
- `mapPayPalStatus(x: any): PaymentStatus`

---

## 7 — Client package (`packages/client`)

- Minimal browser helpers only (no secrets, no server code).
- Support:
  - Stripe.js flow helper: feed it `clientPayload.clientSecret` and return client completion helper.
  - Razorpay Checkout helper: accept `clientPayload.orderId` and open checkout.

- Build tiny bundle via esbuild/tsup. Expose ESM for browser imports.

---

## 8 — Testing

- Unit tests for `core`, `utils`, and each adapter.
- Mock provider SDKs / endpoints in unit tests.
- Contract tests verifying that each adapter returns normalized `Payment` objects for a set of canonical responses.
- Optional integration tests run only when env vars present; document env vars and mark integrations optional in CI.
- Include test that simulates tampered webhook signatures and asserts verification failure.

---

## 9 — Build & publish

- Use npm workspaces to manage packages.
- Provide `build` scripts using **tsup** or **esbuild** for each package.
- Output: ESM, CJS, `.d.ts`.
- Add `prepare` script so `npm publish` works after build.
- Provide `package.json` fields for each package (name, version, main/module, types, files).

---

## 10 — README and docs (generate)

Write a clear README at repo root describing:

- Project overview
- Installation steps for workspace and packages
- Quickstart example (core + stripe)
- How to register adapters and instantiate `PaymentClient`
- How to add a new adapter (brief template)
- How to run tests and optional integration tests
- How to build and publish packages

**Example snippet** (must appear in README/docs)

```ts
import { PaymentClient } from '@unipay/core';
import '@unipay/adapter-stripe/register'; // adapter auto-registers itself

const client = new PaymentClient({
  provider: 'stripe',
  config: { secretKey: process.env.STRIPE_SECRET },
});

const payment = await client.createPayment({
  amount: 1000,
  currency: 'USD',
});
```

---

## 11 — Acceptance criteria

The implementation must satisfy these checks:

- `npm run build` completes without TypeScript errors.
- `npm test` passes unit tests.
- `packages/core` exports: `PaymentClient`, `registerAdapter`, `PaymentProvider`, `types`.
- Adapters auto-register (when their package is imported).
- All adapter methods are Promise-based and non-blocking.
- No server or routing code anywhere in repo.
- Outbound HTTP uses undici and reuses agents.
- Retry + idempotency helpers exist and are used where supported.
- Structure allows adding new providers in <150 LOC (adapter template).
- README and `.env.example` (for integration tests) exist.

---

## 12 — Extra notes for implementer

- Keep adapter surface minimal and focused; do not re-expose full provider SDK surface — only map commonly used operations.
- Prefer small, dependency-light code; avoid heavy libs beyond provider SDKs where necessary.
- Use AbortController to bound network calls.
- Document any provider-specific caveats inside adapter README sections.
- Be explicit about what clientPayload contains and what is safe to transmit to browser.

---

## 13 — Deliverables (explicit)

- Complete repo tree as described
- Working TypeScript source for core and adapters
- Utils and client helpers
- Unit tests + optional integration tests
- build/test/lint scripts and GitHub Actions CI suggested config (CI optional)
- README, CLAUDE.md (this file), and sample `.env.example`
- Adapter template for adding new providers

---

End of CLAUDE.md — implement exactly as specified above.
