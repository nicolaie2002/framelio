// Per-instance in-memory limiter for fast abuse control on serverless API routes.
const buckets = new Map();

function nowMs() {
  return Date.now();
}

function cleanupExpiredEntries(timestamp, maxWindowMs) {
  for (const [key, bucket] of buckets.entries()) {
    if (!bucket.length || timestamp - bucket[bucket.length - 1] > maxWindowMs) {
      buckets.delete(key);
    }
  }
}

export function getClientIp(request) {
  const forwarded = request.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers['x-real-ip'];
  if (typeof realIp === 'string' && realIp.trim()) return realIp.trim();
  return 'unknown';
}

export function checkRateLimit({ key, limit, windowMs }) {
  const timestamp = nowMs();
  cleanupExpiredEntries(timestamp, windowMs);

  const bucket = buckets.get(key) || [];
  const active = bucket.filter((hit) => timestamp - hit < windowMs);
  if (active.length >= limit) {
    const retryAfterMs = windowMs - (timestamp - active[0]);
    return {
      allowed: false,
      limit,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
    };
  }

  active.push(timestamp);
  buckets.set(key, active);
  return {
    allowed: true,
    limit,
    remaining: Math.max(0, limit - active.length),
    retryAfterSeconds: 0,
  };
}

export function applyRateLimit(response, outcome) {
  response.setHeader('X-RateLimit-Limit', String(outcome.limit));
  response.setHeader('X-RateLimit-Remaining', String(outcome.remaining));
  if (!outcome.allowed) {
    response.setHeader('Retry-After', String(outcome.retryAfterSeconds));
  }
}
