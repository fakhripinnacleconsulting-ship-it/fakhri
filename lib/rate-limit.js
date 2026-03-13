/**
 * Simple In-Memory Rate Limiter
 * 
 * Prevents brute-force attacks and abuse on exposed API endpoints 
 * like login, OTP verification, and password resets.
 */

import { logger } from './logger';

const log = logger('RateLimiter');

class RateLimiter {
    constructor(windowMs = 60 * 1000, maxRequests = 10) {
        this.windowMs = windowMs;
        this.maxRequests = maxRequests;
        this.clients = new Map();
    }

    /**
     * Checks if a key (e.g. IP address or email) has exceeded the rate limit.
     * @param {string} key - Identifier to track
     * @returns {Object} { allowed: boolean, remaining: number }
     */
    check(key) {
        const now = Date.now();
        const client = this.clients.get(key);

        // Clean up expired entries occasionally
        if (this.clients.size > 10000) this._cleanup();

        if (!client) {
            this.clients.set(key, { count: 1, expiry: now + this.windowMs });
            return { allowed: true, remaining: this.maxRequests - 1 };
        }

        if (now > client.expiry) {
            // Expired, reset
            this.clients.set(key, { count: 1, expiry: now + this.windowMs });
            return { allowed: true, remaining: this.maxRequests - 1 };
        }

        if (client.count >= this.maxRequests) {
            log.warn(`Rate limit exceeded for key: ${key}`);
            return { allowed: false, remaining: 0 };
        }

        // Increment
        client.count += 1;
        this.clients.set(key, client);
        return { allowed: true, remaining: this.maxRequests - client.count };
    }

    _cleanup() {
        const now = Date.now();
        for (const [key, client] of this.clients.entries()) {
            if (now > client.expiry) {
                this.clients.delete(key);
            }
        }
        log.debug('Cleaned up rate limit store');
    }
}

// Global instances for different use cases
export const authLimiter = new RateLimiter(15 * 60 * 1000, 5); // 5 attempts per 15 mins for login/OTP
export const apiLimiter = new RateLimiter(60 * 1000, 60);      // 60 requests per minute for general APIs
