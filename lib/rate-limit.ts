// lib/rate-limit.ts
// Rate Limiting - Works with or without Upstash Redis

import { NextRequest, NextResponse } from 'next/server';

// In-memory fallback for development/no-Upstash
const inMemoryStore = new Map<string, { count: number; resetTime: number }>();

// Rate limit tiers enum
export enum RateLimitTier {
  API = 'api',
  AUTH = 'auth',
  PAYMENT = 'payment',
  SEARCH = 'search',
  ADMIN = 'admin',
}

// Rate limit configurations
const RATE_LIMITS = {
  api: { requests: 100, windowMs: 15 * 60 * 1000 }, // 100 requests per 15 min
  auth: { requests: 10, windowMs: 15 * 60 * 1000 }, // 10 requests per 15 min
  payment: { requests: 5, windowMs: 60 * 1000 }, // 5 requests per minute
  search: { requests: 30, windowMs: 60 * 1000 }, // 30 requests per minute
  admin: { requests: 50, windowMs: 60 * 1000 }, // 50 requests per minute
};

type RateLimiterType = keyof typeof RATE_LIMITS;

/**
 * Get client IP from request headers
 */
export function getClientIP(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  return '127.0.0.1';
}

/**
 * In-memory rate limiting
 */
function checkInMemoryRateLimit(
  ip: string,
  type: RateLimiterType
): { success: boolean; remaining: number; reset: number } {
  const config = RATE_LIMITS[type];
  const key = `${type}:${ip}`;
  const now = Date.now();
  
  const record = inMemoryStore.get(key);
  
  if (!record || now > record.resetTime) {
    // New window
    inMemoryStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return {
      success: true,
      remaining: config.requests - 1,
      reset: now + config.windowMs,
    };
  }
  
  if (record.count >= config.requests) {
    return {
      success: false,
      remaining: 0,
      reset: record.resetTime,
    };
  }
  
  record.count++;
  return {
    success: true,
    remaining: config.requests - record.count,
    reset: record.resetTime,
  };
}

/**
 * Rate limit middleware wrapper
 */
export async function checkRateLimit(
  request: NextRequest,
  type: RateLimiterType = 'api'
): Promise<{ success: boolean; remaining: number; reset: number } | null> {
  try {
    const ip = getClientIP(request);
    return checkInMemoryRateLimit(ip, type);
  } catch (error) {
    console.error('Rate limit check failed:', error);
    return null; // Allow request on error
  }
}

// Alias for compatibility
export const rateLimit = checkRateLimit;

/**
 * Create rate limit response
 */
export function createRateLimitResponse(reset: number): NextResponse {
  const retryAfter = Math.ceil((reset - Date.now()) / 1000);

  return NextResponse.json(
    {
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter,
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfter),
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(reset),
      },
    }
  );
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  remaining: number,
  reset: number
): NextResponse {
  response.headers.set('X-RateLimit-Remaining', String(remaining));
  response.headers.set('X-RateLimit-Reset', String(reset));
  return response;
}

// ═══════════════════════════════════════════════════════════════
// CACHING UTILITIES (In-memory)
// ═══════════════════════════════════════════════════════════════

const memoryCache = new Map<string, { value: unknown; expires: number }>();

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    const item = memoryCache.get(key);
    if (!item) return null;
    if (Date.now() > item.expires) {
      memoryCache.delete(key);
      return null;
    }
    return item.value as T;
  },

  async set(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
    memoryCache.set(key, {
      value,
      expires: Date.now() + ttlSeconds * 1000,
    });
  },

  async delete(key: string): Promise<void> {
    memoryCache.delete(key);
  },

  async invalidatePattern(pattern: string): Promise<void> {
    const regex = new RegExp(pattern.replace('*', '.*'));
    for (const key of memoryCache.keys()) {
      if (regex.test(key)) {
        memoryCache.delete(key);
      }
    }
  },
};

// Cache key generators
export const cacheKeys = {
  product: (slug: string) => `product:${slug}`,
  productList: (page: number, filters: string) => `products:${page}:${filters}`,
  brand: (slug: string) => `brand:${slug}`,
  brandList: () => 'brands:all',
  cart: (userId: string) => `cart:${userId}`,
  settings: (key: string) => `settings:${key}`,
};
