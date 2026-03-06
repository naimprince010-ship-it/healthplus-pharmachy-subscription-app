import { redis, isRedisEnabled } from './redis'

/**
 * Retrieves data from the cache.
 * If data is not found or Redis is unavailable, returns null.
 */
export async function getCachedData<T>(key: string): Promise<T | null> {
    if (!isRedisEnabled || !redis) return null

    try {
        const data = await redis.get<T>(key)
        if (data) {
            console.log(`[REDIS HIT] Key: ${key}`)
            return data
        }
    } catch (error) {
        console.error(`[REDIS ERROR] Failed to fetch key: ${key}`, error)
    }

    console.log(`[REDIS MISS / DB HIT] Key: ${key}`)
    return null
}

/**
 * Stores data in the cache with an expiration time in seconds (ex parameter).
 * Default expiration is 1 hour (3600 seconds).
 */
export async function setCachedData(key: string, value: any, expirationInSeconds: number = 3600): Promise<void> {
    if (!isRedisEnabled || !redis) return

    try {
        await redis.set(key, value, { ex: expirationInSeconds })
    } catch (error) {
        console.error(`[REDIS ERROR] Failed to set key: ${key}`, error)
    }
}

/**
 * Invalidates a specific key in the cache.
 * Useful for when data is updated/deleted.
 */
export async function invalidateCache(key: string): Promise<void> {
    if (!isRedisEnabled || !redis) return

    try {
        await redis.del(key)
        console.log(`[REDIS INVALIDATE] Key: ${key}`)
    } catch (error) {
        console.error(`[REDIS ERROR] Failed to invalidate key: ${key}`, error)
    }
}
