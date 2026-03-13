'use server';

import * as service from './services/push-subscription.service';

export const saveSubscription = service.saveSubscription;
export const removeSubscription = service.removeSubscription;
