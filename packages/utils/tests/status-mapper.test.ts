import { describe, it, expect } from 'vitest';
import { mapStripeStatus, mapRazorpayStatus, mapPayPalStatus } from '../src/status-mapper.js';

describe('Status Mappers', () => {
  describe('Stripe', () => {
    it('should map Stripe statuses correctly', () => {
      expect(mapStripeStatus('requires_payment_method')).toBe('created');
      expect(mapStripeStatus('requires_action')).toBe('requires_action');
      expect(mapStripeStatus('processing')).toBe('processing');
      expect(mapStripeStatus('succeeded')).toBe('succeeded');
      expect(mapStripeStatus('canceled')).toBe('failed');
    });
  });

  describe('Razorpay', () => {
    it('should map Razorpay statuses correctly', () => {
      expect(mapRazorpayStatus('created')).toBe('created');
      expect(mapRazorpayStatus('authorized', false)).toBe('requires_action');
      expect(mapRazorpayStatus('captured')).toBe('captured');
      expect(mapRazorpayStatus('refunded')).toBe('refunded');
      expect(mapRazorpayStatus('failed')).toBe('failed');
    });
  });

  describe('PayPal', () => {
    it('should map PayPal statuses correctly', () => {
      expect(mapPayPalStatus('CREATED')).toBe('created');
      expect(mapPayPalStatus('APPROVED')).toBe('requires_action');
      expect(mapPayPalStatus('COMPLETED')).toBe('succeeded');
      expect(mapPayPalStatus('VOIDED')).toBe('failed');
      expect(mapPayPalStatus('REFUNDED')).toBe('refunded');
    });
  });
});
