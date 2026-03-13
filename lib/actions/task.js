'use server';

import * as service from './services/task.service';

export const getTasks = service.getTasks;
export const upsertTask = service.upsertTask;
export const deleteTask = service.deleteTask;
export const bulkDeleteTasks = service.bulkDeleteTasks;
export const uploadTaskAttachment = service.uploadTaskAttachment;
export const updateTaskStatus = service.updateTaskStatus;
export const addTaskUpdate = service.addTaskUpdate;
export const notifyOverdueTasks = service.notifyOverdueTasks;
export const getActiveTaskCounts = service.getActiveTaskCounts;
