type RateLimitOptions = {
  windowMs: number;
  max: number;
};

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
  remaining: number;
};

const GLOBAL_STORE_KEY = "__travel_booking_rate_limit_store__";

function getStore() {
  const globalObject = globalThis as typeof globalThis & {
    [GLOBAL_STORE_KEY]?: Map<string, RateLimitBucket>;
  };

  if (!globalObject[GLOBAL_STORE_KEY]) {
    globalObject[GLOBAL_STORE_KEY] = new Map<string, RateLimitBucket>();
  }

  return globalObject[GLOBAL_STORE_KEY];
}

function cleanupExpiredBuckets(store: Map<string, RateLimitBucket>, now: number) {
  if (store.size < 2000) return;

  for (const [key, bucket] of store.entries()) {
    if (bucket.resetAt <= now) {
      store.delete(key);
    }
  }
}

export function getClientIp(request: { headers: Headers }) {
  const forwardedFor =
    request.headers.get("x-forwarded-for") ??
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip");

  if (!forwardedFor) {
    return "unknown";
  }

  const firstIp = forwardedFor.split(",")[0]?.trim();
  return firstIp || "unknown";
}

export function consumeRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const store = getStore();
  cleanupExpiredBuckets(store, now);

  const existing = store.get(key);

  if (!existing || existing.resetAt <= now) {
    const nextBucket: RateLimitBucket = {
      count: 1,
      resetAt: now + options.windowMs,
    };
    store.set(key, nextBucket);

    return {
      allowed: true,
      retryAfterSeconds: 0,
      remaining: Math.max(0, options.max - 1),
    };
  }

  if (existing.count >= options.max) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
      remaining: 0,
    };
  }

  existing.count += 1;
  store.set(key, existing);

  return {
    allowed: true,
    retryAfterSeconds: 0,
    remaining: Math.max(0, options.max - existing.count),
  };
}

