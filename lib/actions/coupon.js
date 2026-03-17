'use server';

import * as service from './services/coupon.service';

export const getCoupons = service.getCoupons;
export const upsertCoupon = service.upsertCoupon;
export const deleteCoupon = service.deleteCoupon;
export const validateCoupon = service.validateCoupon;
