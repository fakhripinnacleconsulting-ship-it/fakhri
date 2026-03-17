import { logger } from './logger';

const log = logger('Cache');

/**
 * Interface-like structure for caching.
 * Currently uses In-Memory Map.
 * Can be swapped for Redis in production.
 */
class CacheProvider {
    constructor(maxSize = 200) {
        this.cache = new Map();
        this.maxSize = maxSize;
        this.type = 'memory';
    }

    async get(key) {
        const item = this.cache.get(key);
        if (!item) return null;

        if (Date.now() > item.expiry) {
            log.debug(`Cache expired for: ${key}`);
            this.cache.delete(key);
            return null;
        }

        // Move to end (LRU)
        this.cache.delete(key);
        this.cache.set(key, item);
        return item.value;
    }

    async set(key, value, ttlSeconds = 300) {
        if (this.cache.size >= this.maxSize) {
            const oldestKey = this.cache.keys().next().value;
            this.cache.delete(oldestKey);
        }

        const expiry = Date.now() + (ttlSeconds * 1000);
        this.cache.set(key, { value, expiry });
        log.debug(`Cache set: ${key} (${ttlSeconds}s)`);
    }

    async del(key) {
        this.cache.delete(key);
    }

    async clear() {
        this.cache.clear();
    }

    /**
     * Wrap a function with caching
     */
    async wrap(key, fn, ttl = 300) {
        const cached = await this.get(key);
        if (cached !== null) return cached;

        const result = await fn();
        await this.set(key, result, ttl);
        return result;
    }
}

// Export singleton
export const cache = new CacheProvider();
