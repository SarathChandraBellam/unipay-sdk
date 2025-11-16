# Adapter Template

This guide shows you how to create a new payment provider adapter for UniPay SDK.

## Overview

An adapter implements the `PaymentProvider` interface and translates provider-specific APIs into UniPay's normalized format. Each adapter should be <150 lines of code for core operations.

## Step-by-Step Guide

### 1. Create Package Structure

```bash
mkdir -p packages/adapter-<provider>/{src,tests}
cd packages/adapter-<provider>
```

### 2. Create package.json

```json
{
  "name": "@unipay/adapter-<provider>",
  "version": "1.0.0",
  "description": "<Provider> adapter for UniPay SDK",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    },
    "./register": {
      "import": "./dist/register.js",
      "require": "./dist/register.cjs",
      "types": "./dist/register.d.ts"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup src/index.ts src/register.ts --format esm,cjs --dts --clean",
    "dev": "tsup src/index.ts src/register.ts --format esm,cjs --dts --watch",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@unipay/core": "workspace:*",
    "@unipay/utils": "workspace:*"
  },
  "devDependencies": {
    "tsup": "^8.0.1",
    "typescript": "^5.3.3"
  }
}
```

### 3. Implement the Adapter (src/adapter.ts)

```typescript
import type {
  PaymentProvider,
  CreatePaymentInput,
  Payment,
  RefundResult,
  WebhookVerificationResult,
} from '@unipay/core';
import { PaymentOperationError } from '@unipay/core';
import { map<Provider>Status } from '@unipay/utils';

export interface <Provider>AdapterConfig {
  apiKey: string;
  apiSecret?: string;
  webhookSecret?: string;
}

export class <Provider>Adapter implements PaymentProvider {
  private client: any;
  private webhookSecret?: string;

  constructor(config: <Provider>AdapterConfig) {
    // Initialize provider SDK or HTTP client
    this.webhookSecret = config.webhookSecret;
  }

  private extractPaymentId(paymentId: string): string {
    if (paymentId.startsWith('<provider>_')) {
      return paymentId.replace('<provider>_', '');
    }
    return paymentId;
  }

  private normalizePayment(providerPayment: any): Payment {
    return {
      id: `<provider>_${providerPayment.id}`,
      provider: '<provider>',
      providerPaymentId: providerPayment.id,
      amount: providerPayment.amount,
      currency: providerPayment.currency,
      status: map<Provider>Status(providerPayment.status),
      createdAt: new Date(providerPayment.created_at).toISOString(),
      metadata: providerPayment.metadata,
      clientPayload: {
        // Provider-specific client data
      },
    };
  }

  async createPayment(input: CreatePaymentInput): Promise<Payment> {
    try {
      // Call provider API
      const result = await this.client.createPayment({
        amount: input.amount,
        currency: input.currency,
        // ... map other fields
      });

      return this.normalizePayment(result);
    } catch (error) {
      throw new PaymentOperationError(
        error instanceof Error ? error.message : 'Failed to create payment',
        'createPayment',
        undefined,
        '<provider>'
      );
    }
  }

  async confirmPayment(paymentId: string, clientData?: any): Promise<Payment> {
    // Implement confirm logic
    throw new Error('Not implemented');
  }

  async capturePayment(paymentId: string, amount?: number): Promise<Payment> {
    // Implement capture logic
    throw new Error('Not implemented');
  }

  async refundPayment(paymentId: string, amount?: number): Promise<RefundResult> {
    // Implement refund logic
    throw new Error('Not implemented');
  }

  async getPayment(paymentId: string): Promise<Payment> {
    // Implement get payment logic
    throw new Error('Not implemented');
  }

  async verifyWebhook(
    headers: Record<string, string>,
    rawBody: string
  ): Promise<WebhookVerificationResult> {
    if (!this.webhookSecret) {
      throw new Error('Webhook secret not configured');
    }

    // Implement webhook verification
    try {
      // Verify signature
      const valid = true; // Your verification logic

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

export function create<Provider>Adapter(config: <Provider>AdapterConfig): <Provider>Adapter {
  return new <Provider>Adapter(config);
}
```

### 4. Export Adapter (src/index.ts)

```typescript
export { <Provider>Adapter, create<Provider>Adapter } from './adapter.js';
export type { <Provider>AdapterConfig } from './adapter.js';
```

### 5. Create Auto-Register (src/register.ts)

```typescript
import { registerAdapter } from '@unipay/core';
import { create<Provider>Adapter } from './adapter.js';

registerAdapter('<provider>', create<Provider>Adapter);
```

### 6. Add Status Mapper (in @unipay/utils)

```typescript
// In packages/utils/src/status-mapper.ts
export function map<Provider>Status(status: string | unknown): PaymentStatus {
  if (typeof status !== 'string') {
    return 'failed';
  }

  switch (status) {
    case 'CREATED':
      return 'created';
    case 'COMPLETED':
      return 'succeeded';
    // ... map other statuses
    default:
      return 'failed';
  }
}
```

### 7. Add Tests

```typescript
// tests/adapter.test.ts
import { describe, it, expect } from 'vitest';
import { <Provider>Adapter } from '../src/adapter.js';

describe('<Provider> Adapter', () => {
  it('should create payment', async () => {
    const adapter = new <Provider>Adapter({
      apiKey: 'test_key',
    });

    // Add test logic
  });
});
```

### 8. Add TypeScript Config

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"],
  "references": [{ "path": "../core" }, { "path": "../utils" }]
}
```

## Testing Your Adapter

```bash
# Build the adapter
npm run build

# Run tests
npm test

# Test integration
cd ../../
npm install
npm run build
```

## Best Practices

1. **Keep it simple** - Aim for <150 LOC for core operations
2. **Type safety** - Use strict TypeScript types
3. **Error handling** - Wrap provider errors in `PaymentOperationError`
4. **Async/await** - All methods must be async
5. **Status mapping** - Use status mapper from utils
6. **Webhook verification** - Implement secure signature verification
7. **Documentation** - Add JSDoc comments
8. **Tests** - Write unit and integration tests

## Checklist

- [ ] Package structure created
- [ ] `PaymentProvider` interface implemented
- [ ] Status mapper added to utils
- [ ] Auto-register file created
- [ ] Tests written
- [ ] Documentation updated
- [ ] Build passes without errors
- [ ] No TypeScript errors

## Submit PR

Once your adapter is complete and tested:

1. Update root README.md to list your adapter
2. Add provider-specific documentation
3. Submit a pull request
4. Respond to code review feedback

Thank you for contributing to UniPay SDK!
