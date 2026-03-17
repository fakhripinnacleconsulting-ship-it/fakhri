'use server';

import * as service from './services/response.service';

export const submitContactForm = service.submitContactForm;
export const submitJobApplication = service.submitJobApplication;
export const submitClientFeedback = service.submitClientFeedback;
export const getAllResponses = service.getAllResponses;
export const updateResponseStatus = service.updateResponseStatus;
export const deleteResponse = service.deleteResponse;
export const notifySuperAdmins = service.notifySuperAdmins; // Some components might use this helper
