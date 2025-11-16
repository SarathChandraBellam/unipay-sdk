/**
 * Custom error classes for UniPay SDK
 */

/**
 * Base error class for all SDK errors
 */
export class UniPayError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number,
    public readonly provider?: string
  ) {
    super(message);
    this.name = 'UniPayError';
    Object.setPrototypeOf(this, UniPayError.prototype);
  }
}

/**
 * Error thrown when a provider is not found
 */
export class ProviderNotFoundError extends UniPayError {
  constructor(provider: string) {
    super(`Provider '${provider}' not found. Did you register the adapter?`, 'PROVIDER_NOT_FOUND');
    this.name = 'ProviderNotFoundError';
    Object.setPrototypeOf(this, ProviderNotFoundError.prototype);
  }
}

/**
 * Error thrown when provider configuration is invalid
 */
export class InvalidConfigError extends UniPayError {
  constructor(message: string, provider?: string) {
    super(message, 'INVALID_CONFIG', undefined, provider);
    this.name = 'InvalidConfigError';
    Object.setPrototypeOf(this, InvalidConfigError.prototype);
  }
}

/**
 * Error thrown when a payment operation fails
 */
export class PaymentOperationError extends UniPayError {
  constructor(
    message: string,
    public readonly operation: string,
    statusCode?: number,
    provider?: string
  ) {
    super(message, 'PAYMENT_OPERATION_FAILED', statusCode, provider);
    this.name = 'PaymentOperationError';
    Object.setPrototypeOf(this, PaymentOperationError.prototype);
  }
}

/**
 * Error thrown when validation fails
 */
export class ValidationError extends UniPayError {
  constructor(message: string, public readonly field?: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Error thrown when an operation times out
 */
export class TimeoutError extends UniPayError {
  constructor(message: string, public readonly timeoutMs: number) {
    super(message, 'TIMEOUT');
    this.name = 'TimeoutError';
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

/**
 * Error thrown when an operation is aborted
 */
export class AbortError extends UniPayError {
  constructor(message: string = 'Operation was aborted') {
    super(message, 'ABORTED');
    this.name = 'AbortError';
    Object.setPrototypeOf(this, AbortError.prototype);
  }
}
