/**
 * Adapter registry for managing payment providers
 */

import type { AdapterFactory, PaymentProvider } from './types.js';
import { ProviderNotFoundError } from './errors.js';

/**
 * Registry of payment provider adapters
 */
class AdapterRegistry {
  private adapters = new Map<string, AdapterFactory>();

  /**
   * Register a payment provider adapter
   * @param name - Provider name (e.g., 'stripe', 'razorpay', 'paypal')
   * @param factory - Factory function that creates provider instance
   */
  register(name: string, factory: AdapterFactory): void {
    this.adapters.set(name.toLowerCase(), factory);
  }

  /**
   * Get a payment provider adapter factory
   * @param name - Provider name
   * @returns Adapter factory or undefined if not found
   */
  get(name: string): AdapterFactory | undefined {
    return this.adapters.get(name.toLowerCase());
  }

  /**
   * Check if a provider is registered
   * @param name - Provider name
   * @returns True if provider is registered
   */
  has(name: string): boolean {
    return this.adapters.has(name.toLowerCase());
  }

  /**
   * Get all registered provider names
   * @returns Array of provider names
   */
  list(): string[] {
    return Array.from(this.adapters.keys());
  }

  /**
   * Create a provider instance
   * @param name - Provider name
   * @param config - Provider configuration
   * @returns Provider instance
   * @throws {ProviderNotFoundError} If provider is not registered
   */
  create(name: string, config: any): PaymentProvider {
    const factory = this.get(name);
    if (!factory) {
      throw new ProviderNotFoundError(name);
    }
    return factory(config);
  }
}

// Singleton instance
const registry = new AdapterRegistry();

/**
 * Register a payment provider adapter
 * @param name - Provider name
 * @param factory - Factory function that creates provider instance
 */
export function registerAdapter(name: string, factory: AdapterFactory): void {
  registry.register(name, factory);
}

/**
 * Get a payment provider adapter factory
 * @param name - Provider name
 * @returns Adapter factory or undefined if not found
 */
export function getAdapter(name: string): AdapterFactory | undefined {
  return registry.get(name);
}

/**
 * Check if a provider is registered
 * @param name - Provider name
 * @returns True if provider is registered
 */
export function hasAdapter(name: string): boolean {
  return registry.has(name);
}

/**
 * Get all registered provider names
 * @returns Array of provider names
 */
export function listAdapters(): string[] {
  return registry.list();
}

/**
 * Create a provider instance (internal use)
 * @param name - Provider name
 * @param config - Provider configuration
 * @returns Provider instance
 * @internal
 */
export function createProvider(name: string, config: any): PaymentProvider {
  return registry.create(name, config);
}
