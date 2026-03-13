'use server';

import * as service from './services/checkout.service';

export const createRazorpayOrder = service.createRazorpayOrder;
export const verifyPayment = service.verifyPayment;
export const processCheckout = service.processCheckout;
