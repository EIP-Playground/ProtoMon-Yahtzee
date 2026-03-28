import { randomBytes } from "node:crypto";

import { getRedis } from "@/lib/server/redis";
import type { DealerProof, HexAddress, HexString, StoredDiceArray } from "@/types/game";

export type BackendGameSession = {
  gameId: HexString;
  player: HexAddress;
  rewardRecipient: HexAddress;
  bossId: number;
  turn: number;
  rollCount: number;
  currentDice: StoredDiceArray;
  finalized: boolean;
  finalizedProof: DealerProof | null;
  createdAt: number;
  expiresAt: number;
};

const SESSION_TTL_SECONDS = 2 * 60 * 60;
const EMPTY_DICE: StoredDiceArray = [0, 0, 0, 0, 0];

export function getGameSessionKey(gameId: string) {
  return `game:${gameId}`;
}

export function createGameId() {
  return `0x${randomBytes(32).toString("hex")}` as HexString;
}

function getSessionTtlSeconds(expiresAt: number, now = Date.now()) {
  return Math.max(1, Math.ceil((expiresAt - now) / 1000));
}

export function createBackendGameSession(input: {
  gameId: HexString;
  player: HexAddress;
  rewardRecipient: HexAddress;
  bossId: number;
  now?: number;
}) {
  const now = input.now ?? Date.now();

  return {
    gameId: input.gameId,
    player: input.player,
    rewardRecipient: input.rewardRecipient,
    bossId: input.bossId,
    turn: 1,
    rollCount: 0,
    currentDice: EMPTY_DICE,
    finalized: false,
    finalizedProof: null,
    createdAt: now,
    expiresAt: now + SESSION_TTL_SECONDS * 1000,
  } satisfies BackendGameSession;
}

export async function getBackendGameSession(gameId: string) {
  return getRedis().get<BackendGameSession>(getGameSessionKey(gameId));
}

export async function saveBackendGameSession(session: BackendGameSession, now = Date.now()) {
  const ttlSeconds = getSessionTtlSeconds(session.expiresAt, now);
  await getRedis().set(getGameSessionKey(session.gameId), session, {
    ex: ttlSeconds,
  });
  return session;
}

export async function updateBackendGameSession(
  gameId: string,
  updater: (session: BackendGameSession) => BackendGameSession,
  now = Date.now(),
) {
  const session = await getBackendGameSession(gameId);

  if (!session) {
    return null;
  }

  const updatedSession = updater(session);
  await saveBackendGameSession(updatedSession, now);
  return updatedSession;
}
