'use server';

import * as service from './services/file.service';

export const getFiles = service.getFiles;
export const getFilesByClientId = service.getFilesByClientId;
export const getSuperAdminFiles = service.getSuperAdminFiles;
export const uploadFiles = service.uploadFiles;
export const deleteFile = service.deleteFile;
