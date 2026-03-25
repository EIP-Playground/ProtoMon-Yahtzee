import { Redis } from "@upstash/redis";

export type RedisClient = Pick<Redis, "get" | "set">;

let redis: RedisClient | null = null;

export function getRedis(): RedisClient {
  if (!redis) {
    redis = Redis.fromEnv();
  }

  return redis;
}
