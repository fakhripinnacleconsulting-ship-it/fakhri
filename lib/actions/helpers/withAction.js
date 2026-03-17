'use server';

import connectDB from '@/lib/mongodb';
import { logger } from '@/lib/logger';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

/**
 * withAction — Higher-order wrapper for server actions
 * 
 * Eliminates repetitive connectDB(), try/catch, and adds:
 * - Automatic DB connection
 * - Structured logging with execution time
 * - Consistent error response format
 * - Optional session validation
 * 
 * Usage:
 *   export const getClients = withAction('getClients', async (filter, ctx) => {
 *       const clients = await User.find(filter).lean();
 *       return { success: true, data: clients };
 *   });
 * 
 *   // With auth required:
 *   export const deleteClient = withAction('deleteClient', async (id, ctx) => {
 *       // ctx.session is available
 *       await User.findByIdAndDelete(id);
 *       return { success: true };
 *   }, { requireAuth: true });
 */

export function withAction(name, fn, options = {}) {
    const { requireAuth = false, module = 'Action' } = options;
    const log = logger(`${module}/${name}`);

    return async (...args) => {
        const start = performance.now();

        try {
            await connectDB();

            let session = null;
            if (requireAuth) {
                session = await getServerSession(authOptions);
                if (!session) {
                    log.warn('Unauthorized access attempt');
                    return { success: false, error: 'Authentication required' };
                }
            }

            const ctx = { session, log };
            const result = await fn(...args, ctx);

            const duration = Math.round(performance.now() - start);
            log.info('Completed', { durationMs: duration });

            return result;
        } catch (error) {
            const duration = Math.round(performance.now() - start);
            log.error('Failed', {
                durationMs: duration,
                error: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            });

            return {
                success: false,
                error: process.env.NODE_ENV === 'development'
                    ? error.message
                    : 'An unexpected error occurred. Please try again.',
            };
        }
    };
}
