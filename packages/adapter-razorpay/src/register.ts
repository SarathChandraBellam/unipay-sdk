/**
 * Auto-register Razorpay adapter
 */

import { registerAdapter } from '@unipay/core';
import { createRazorpayAdapter } from './adapter.js';

registerAdapter('razorpay', createRazorpayAdapter);
