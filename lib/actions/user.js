'use server';

import * as service from './services/user.service';

export const getUsers = service.getUsers;
export const getUserById = service.getUserById;
export const getUserByEmail = service.getUserByEmail;
export const updatePerformance = service.updatePerformance;
export const updateUser = service.updateUser;
export const updatePaymentMethod = service.updatePaymentMethod;
export const setDefaultPaymentMethod = service.setDefaultPaymentMethod;
export const deletePaymentMethod = service.deletePaymentMethod;
export const addClientSubscribedServices = service.addClientSubscribedServices;
