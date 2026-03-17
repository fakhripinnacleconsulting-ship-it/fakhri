'use server';

import * as service from './services/auth.service';

export const requestPasswordReset = service.requestPasswordReset;
export const resetPassword = service.resetPassword;
export const validateResetToken = service.validateResetToken;
