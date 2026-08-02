type Bucket = {
  attempts: number[];
};

const buckets = new Map<string, Bucket>();

export function allowRequest(
  key: string,
  limit: number,
  windowMs: number
) {
  const now = Date.now();
  const cutoff = now - windowMs;
  const bucket = buckets.get(key) || { attempts: [] };
  bucket.attempts = bucket.attempts.filter((attempt) => attempt > cutoff);

  if (bucket.attempts.length >= limit) {
    buckets.set(key, bucket);
    return false;
  }

  bucket.attempts.push(now);
  buckets.set(key, bucket);

  if (buckets.size > 5_000) {
    for (const [bucketKey, value] of buckets) {
      if (value.attempts.every((attempt) => attempt <= cutoff)) {
        buckets.delete(bucketKey);
      }
      if (buckets.size <= 4_000) break;
    }
  }

  return true;
}

export function requestIp(headers: Headers) {
  const forwarded = headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}
