'use server';

import * as service from './services/user.service';

export const submitProfileUpdateRequest = service.submitProfileUpdateRequest;
export const getProfileUpdateRequests = service.getProfileUpdateRequests;
export const approveProfileUpdateRequest = service.approveProfileUpdateRequest;
export const rejectProfileUpdateRequest = service.rejectProfileUpdateRequest;
export const getPendingRequestForUser = service.getPendingRequestForUser;
