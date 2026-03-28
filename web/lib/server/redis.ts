import IORedis from "ioredis";
import { Redis as UpstashRedis } from "@upstash/redis";

type RedisSetOptions = {
  ex?: number;
};

export type RedisClient = {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, options?: RedisSetOptions): Promise<unknown>;
};

class LocalRedisClient implements RedisClient {
  constructor(private readonly redis: IORedis) {}

  private async ensureReady() {
    if (this.redis.status === "wait") {
      await this.redis.connect();
    }
  }

  async get<T>(key: string) {
    await this.ensureReady();
    const raw = await this.redis.get(key);

    if (raw === null) {
      return null;
    }

    return JSON.parse(raw) as T;
  }

  async set(key: string, value: unknown, options?: RedisSetOptions) {
    await this.ensureReady();
    const payload = JSON.stringify(value);

    if (options?.ex) {
      return this.redis.set(key, payload, "EX", options.ex);
    }

    return this.redis.set(key, payload);
  }
}

let redis: RedisClient | null = null;
let localRedis: IORedis | null = null;

function createLocalRedisClient(redisUrl: string) {
  if (!localRedis) {
    localRedis = new IORedis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    });
  }

  return new LocalRedisClient(localRedis);
}

function createUpstashClient() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    throw new Error(
      "Configure REDIS_URL for local Redis, or UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN for Upstash.",
    );
  }

  return UpstashRedis.fromEnv() as RedisClient;
}

export function getRedis(): RedisClient {
  if (!redis) {
    const redisUrl = process.env.REDIS_URL?.trim();
    redis = redisUrl ? createLocalRedisClient(redisUrl) : createUpstashClient();
  }

  return redis;
}
