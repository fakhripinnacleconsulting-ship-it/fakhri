'use server';

import * as service from './services/settings.service';

export const getSettings = service.getSettings;
export const updateSettings = service.updateSettings;
