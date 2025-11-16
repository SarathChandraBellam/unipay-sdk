import { describe, it, expect, beforeEach } from 'vitest';
import { registerAdapter, getAdapter, hasAdapter, listAdapters } from '../src/registry.js';
import type { PaymentProvider } from '../src/types.js';

describe('Adapter Registry', () => {
  const mockAdapter: PaymentProvider = {
    async createPayment() {
      return {} as any;
    },
    async confirmPayment() {
      return {} as any;
    },
    async capturePayment() {
      return {} as any;
    },
    async refundPayment() {
      return {} as any;
    },
    async getPayment() {
      return {} as any;
    },
  };

  beforeEach(() => {
    // Reset registry by clearing any existing adapters
  });

  it('should register an adapter', () => {
    registerAdapter('test', () => mockAdapter);
    expect(hasAdapter('test')).toBe(true);
  });

  it('should get a registered adapter', () => {
    const factory = () => mockAdapter;
    registerAdapter('test', factory);

    const retrieved = getAdapter('test');
    expect(retrieved).toBeDefined();
  });

  it('should list all registered adapters', () => {
    registerAdapter('test1', () => mockAdapter);
    registerAdapter('test2', () => mockAdapter);

    const adapters = listAdapters();
    expect(adapters).toContain('test1');
    expect(adapters).toContain('test2');
  });
});
