/**
 * Auto-register PayPal adapter
 */

import { registerAdapter } from '@unipay/core';
import { createPayPalAdapter } from './adapter.js';

registerAdapter('paypal', createPayPalAdapter);
