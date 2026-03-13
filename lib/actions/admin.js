'use server';

import { verifySMTP as verifySMTPAction } from '@/lib/mail';
import * as adminService from './services/admin.service';
import * as clientService from './services/client.service';
import * as taskService from './services/task.service';
import * as fileService from './services/file.service';
import * as userService from './services/user.service';
import * as invoiceService from './services/invoice.service';
import * as teamService from './services/team.service';
import * as dashboardService from './services/dashboard.service';
import * as responseService from './services/response.service';

// 1. Auth & Notification
export const verifySMTP = verifySMTPAction;
export const { notifySuperAdmins } = adminService;

// 2. Client Service
export const {
    sendClientEmail,
    getClients,
    upsertClient,
    deleteClient,
    bulkDeleteClients,
    toggleClientStatus,
    updateSubscribedServiceStatus,
    validateBulkClientsData,
    bulkUploadClients,
    bulkExtendSubscription,
    updateClientSubscriptionEnd,
    getNotes,
    upsertNote
} = clientService;

// 3. Task Service
export const {
    getTasks,
    upsertTask,
    deleteTask,
    bulkDeleteTasks,
    uploadTaskAttachment,
    getActiveTaskCounts
} = taskService;

// 4. File Service
export const {
    getFiles,
    getFilesByClientId,
    getSuperAdminFiles,
    uploadFiles,
    deleteFile
} = fileService;

// 5. Admin & Team Service
export const {
    getAdmins,
    getAdminClients,
    getTeamMembers,
    upsertAdmin,
    deleteAdmin,
    toggleAdminStatus
} = adminService;

export const {
    getTeams,
    getTeamWithMembers,
    createTeam,
    updateTeam,
    deleteTeam
} = teamService;

// 6. User Service (Common)
export const {
    getUsers,
    getUserById,
    getUserByEmail,
    updateUser,
    submitProfileUpdateRequest,
    getProfileUpdateRequests,
    approveProfileUpdateRequest,
    rejectProfileUpdateRequest,
    getPendingRequestForUser
} = userService;

// 7. Invoice & Sales Service
export const {
    getInvoices,
    getInvoiceSummary,
    createInvoice,
    getSalesAnalytics
} = invoiceService;

// 8. Dashboard & Analytics
export const {
    getDashboardStats,
    getActivityLogs,
    logActivity
} = dashboardService;

// 9. Responses (Contact, Career, Feedback)
export const {
    getAllResponses,
    updateResponseStatus,
    deleteResponse
} = responseService;
