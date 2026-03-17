/**
 * Structured Logger
 * 
 * Provides leveled, contextual logging with JSON output in production
 * and colored text in development. Drop-in replacement for console.log/error.
 * 
 * Usage:
 *   import { logger } from '@/lib/logger';
 *   const log = logger('ModuleName');
 *   log.info('User created', { userId: '123' });
 *   log.error('Failed to fetch', { error: err.message });
 */

const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };

const CURRENT_LEVEL = LOG_LEVELS[process.env.LOG_LEVEL || 'info'] ?? LOG_LEVELS.info;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

function formatMessage(level, module, message, meta) {
    const timestamp = new Date().toISOString();

    if (IS_PRODUCTION) {
        // JSON format for production (machine-parseable by log aggregators)
        return JSON.stringify({
            timestamp,
            level,
            module,
            message,
            ...(meta && Object.keys(meta).length > 0 ? { meta } : {}),
        });
    }

    // Colored text for development
    const colors = {
        debug: '\x1b[36m', // cyan
        info: '\x1b[32m',  // green
        warn: '\x1b[33m',  // yellow
        error: '\x1b[31m', // red
    };
    const reset = '\x1b[0m';
    const dim = '\x1b[2m';
    const color = colors[level] || reset;

    const metaStr = meta && Object.keys(meta).length > 0
        ? ` ${dim}${JSON.stringify(meta)}${reset}`
        : '';

    return `${dim}${timestamp}${reset} ${color}[${level.toUpperCase()}]${reset} ${dim}[${module}]${reset} ${message}${metaStr}`;
}

export function logger(module = 'App') {
    const log = (level, message, meta) => {
        if (LOG_LEVELS[level] < CURRENT_LEVEL) return;

        const formatted = formatMessage(level, module, message, meta);

        switch (level) {
            case 'error':
                console.error(formatted);
                break;
            case 'warn':
                console.warn(formatted);
                break;
            default:
                console.log(formatted);
        }
    };

    return {
        debug: (message, meta) => log('debug', message, meta),
        info: (message, meta) => log('info', message, meta),
        warn: (message, meta) => log('warn', message, meta),
        error: (message, meta) => log('error', message, meta),

        /** Measure async function execution time */
        async time(label, fn) {
            const start = performance.now();
            try {
                const result = await fn();
                const duration = Math.round(performance.now() - start);
                log('info', `${label} completed`, { durationMs: duration });
                return result;
            } catch (err) {
                const duration = Math.round(performance.now() - start);
                log('error', `${label} failed`, { durationMs: duration, error: err.message });
                throw err;
            }
        },
    };
}
