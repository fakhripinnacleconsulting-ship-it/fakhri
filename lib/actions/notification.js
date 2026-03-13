'use server';

import * as service from './services/notification.service';

export const getNotifications = service.getNotifications;
export const createNotification = service.createNotification;
export const markNotificationAsRead = service.markNotificationAsRead;
export const markAllNotificationsAsRead = service.markAllNotificationsAsRead;
export const deleteNotification = service.deleteNotification;
export const clearAllNotifications = service.clearAllNotifications;
