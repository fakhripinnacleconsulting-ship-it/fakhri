'use server';

import * as service from './services/dashboard.service';

export const getDashboardStats = service.getDashboardStats;
export const logActivity = service.logActivity;
export const getActivityLogs = service.getActivityLogs;
