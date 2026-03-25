export function getRedisUrl() {
  const redisUrl = process.env.REDIS_URL?.trim();
  return redisUrl && redisUrl.length > 0 ? redisUrl : null;
}

export function assertRedisConfigured() {
  const redisUrl = getRedisUrl();

  if (!redisUrl) {
    throw new Error("REDIS_URL is not configured.");
  }

  return redisUrl;
}
