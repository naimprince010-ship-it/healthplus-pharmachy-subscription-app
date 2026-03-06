import { Redis } from '@upstash/redis'

// Initialize the Redis client using environment variables
// Ensure these variables are set in your .env or .env.local file.
// If not set, we'll gracefully fallback or throw an error based on your preference.
const upstashUrl = process.env.UPSTASH_REDIS_REST_URL
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN

// Create a singleton instance
export const redis = upstashUrl && upstashToken
    ? new Redis({
        url: upstashUrl,
        token: upstashToken,
    })
    : null

export const isRedisEnabled = !!redis
