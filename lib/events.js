import { EventEmitter } from 'events';

// Basic event bus for internal system events
class SystemEvents extends EventEmitter { }

export const systemEvents = new SystemEvents();

// Define event names
export const EVENTS = {
    NOTIFICATION_CREATED: 'notification:created',
    INVOICE_PAID: 'invoice:paid',
    TASK_UPDATED: 'task:updated'
};
