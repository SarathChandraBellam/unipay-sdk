/**
 * Auto-register Stripe adapter
 * Import this file to automatically register the Stripe adapter
 */

import { registerAdapter } from '@unipay/core';
import { createStripeAdapter } from './adapter.js';

registerAdapter('stripe', createStripeAdapter);
