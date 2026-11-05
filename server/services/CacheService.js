/**
 * In-Memory TTL Cache Service
 * Prevents third-party rate-limit exhaustion, protects API quotas, and handles network jitter.
 */
class CacheService {
  constructor() {
    this.store = new Map();
  }

  /**
   * Set a cached value with TTL in seconds
   */
  set(key, data, ttlSeconds) {
    const now = Date.now();
    const expiresAt = now + ttlSeconds * 1000;
    this.store.set(key, {
      data,
      retrievedAt: new Date(now).toISOString(),
      expiresAt: new Date(expiresAt).toISOString(),
      expiresAtMs: expiresAt,
    });
  }

  /**
   * Retrieve cached value if not expired
   */
  get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAtMs) {
      this.store.delete(key);
      return null;
    }

    return {
      data: entry.data,
      retrievedAt: entry.retrievedAt,
      expiresAt: entry.expiresAt,
    };
  }

  /**
   * Check if active cache key exists
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Invalidate specific key
   */
  delete(key) {
    return this.store.delete(key);
  }

  /**
   * Flush all cache entries
   */
  clear() {
    this.store.clear();
  }

  /**
   * Fetch with cache fallback:
   * Returns { data, status: 'LIVE' | 'CACHED' | 'UNAVAILABLE' | 'BLOCKED', retrievedAt, error }
   */
  async wrap(key, ttlSeconds, fetchFn) {
    const cached = this.get(key);

    try {
      // Attempt live fetch
      const result = await fetchFn();
      if (result && result.status !== 'UNAVAILABLE' && result.status !== 'BLOCKED') {
        this.set(key, result.data, ttlSeconds);
        return {
          ...result,
          status: 'LIVE',
          retrievedAt: new Date().toISOString(),
        };
      }
      // If result explicitly returned BLOCKED or UNAVAILABLE
      if (result && (result.status === 'BLOCKED' || result.status === 'UNAVAILABLE')) {
        return result;
      }
    } catch (err) {
      // If live fetch threw error, fall back to cache if available
      if (cached) {
        return {
          data: cached.data,
          status: 'CACHED',
          retrievedAt: cached.retrievedAt,
          note: `Live provider failed (${err.message || 'Network error'}). Serving cached observation.`,
        };
      }
      return {
        data: null,
        status: 'UNAVAILABLE',
        retrievedAt: new Date().toISOString(),
        error: err.message || 'External provider failed and no cache is available.',
      };
    }

    // Default fallback if live returned null without throwing
    if (cached) {
      return {
        data: cached.data,
        status: 'CACHED',
        retrievedAt: cached.retrievedAt,
      };
    }

    return {
      data: null,
      status: 'UNAVAILABLE',
      retrievedAt: new Date().toISOString(),
      error: 'No observation data could be retrieved.',
    };
  }
}

export const cacheService = new CacheService();
