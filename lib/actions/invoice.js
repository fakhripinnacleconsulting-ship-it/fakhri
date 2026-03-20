'use server';

import * as service from './services/invoice.service';

export const getInvoices = service.getInvoices;
export const getInvoiceSummary = service.getInvoiceSummary;
export const createInvoice = service.createInvoice;
export const getSalesAnalytics = service.getSalesAnalytics;
export const deleteInvoice = service.deleteInvoice;
