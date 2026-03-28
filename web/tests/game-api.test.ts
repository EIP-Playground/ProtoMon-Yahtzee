import { beforeEach, describe, expect, it, vi } from "vitest";

const store = new Map<string, unknown>();
const redisMock = {
  get: vi.fn(async <T>(key: string) => {
    return (store.get(key) as T | undefined) ?? null;
  }),
  set: vi.fn(async (key: string, value: unknown) => {
    store.set(key, structuredClone(value));
    return "OK";
  }),
};

const generateDiceMock = vi.fn();
const rerollWithMaskMock = vi.fn();

vi.mock("@/lib/server/redis", () => ({
  getRedis: () => redisMock,
}));

vi.mock("@/lib/server/rng", () => ({
  generateDice: (...args: unknown[]) => generateDiceMock(...args),
  rerollWithMask: (...args: unknown[]) => rerollWithMaskMock(...args),
}));

import { POST as createGame } from "@/app/api/game/create/route";
import { POST as advanceGame } from "@/app/api/game/advance/route";
import { POST as finalizeGame } from "@/app/api/game/finalize/route";
import { POST as rerollGame } from "@/app/api/game/reroll/route";
import { POST as rollGame } from "@/app/api/game/roll/route";
import { getGameSessionKey } from "@/lib/server/gameSession";
import { ZERO_ADDRESS } from "@/lib/server/validation";

const player = "0x1111111111111111111111111111111111111111";
const rewardRecipient = "0x2222222222222222222222222222222222222222";
const initialDice = [1, 2, 3, 4, 5] as const;
const rerolledDice = [1, 2, 6, 6, 5] as const;

function jsonRequest(path: string, body: unknown) {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

async function readJson<T>(response: Response) {
  return (await response.json()) as T;
}

describe("game api routes", () => {
  beforeEach(() => {
    store.clear();
    redisMock.get.mockClear();
    redisMock.set.mockClear();
    generateDiceMock.mockReset();
    rerollWithMaskMock.mockReset();
    generateDiceMock.mockReturnValue(initialDice);
    rerollWithMaskMock.mockReturnValue(rerolledDice);
    process.env.NEXT_PUBLIC_CHAIN_ID = "84532";
    process.env.NEXT_PUBLIC_PROTO_MON_GAME_ADDRESS = ZERO_ADDRESS;
    process.env.BACKEND_DEALER_PRIVATE_KEY =
      "0x070beb615c5514c64d37d4b49b6385e6bab11e45ddeadba77703e6e69f6f8c64";
  });

  it("creates a session with boss hp and empty dice state", async () => {
    const response = await createGame(
      jsonRequest("/api/game/create", {
        player,
        rewardRecipient,
        bossId: 1,
      }),
    );

    expect(response.status).toBe(200);
    const payload = await readJson<{
      gameId: string;
      player: string;
      rewardRecipient: string;
      bossId: number;
      bossHp: number;
      turn: number;
      rollCount: number;
    }>(response);

    expect(payload.gameId).toMatch(/^0x[a-f0-9]{64}$/);
    expect(payload).toMatchObject({
      player,
      rewardRecipient,
      bossId: 1,
      bossHp: 150,
      turn: 1,
      rollCount: 0,
    });

    const storedSession = store.get(getGameSessionKey(payload.gameId)) as {
      currentDice: number[];
      finalized: boolean;
    };

    expect(storedSession.currentDice).toEqual([0, 0, 0, 0, 0]);
    expect(storedSession.finalized).toBe(false);
  });

  it("rolls once and blocks a second first-roll attempt", async () => {
    const createResponse = await createGame(
      jsonRequest("/api/game/create", {
        player,
        rewardRecipient,
        bossId: 1,
      }),
    );
    const created = await readJson<{ gameId: string }>(createResponse);

    const firstRollResponse = await rollGame(
      jsonRequest("/api/game/roll", {
        gameId: created.gameId,
        player,
      }),
    );

    expect(firstRollResponse.status).toBe(200);
    expect(await readJson(firstRollResponse)).toMatchObject({
      gameId: created.gameId,
      turn: 1,
      rollCount: 1,
      dice: initialDice,
    });

    const secondRollResponse = await rollGame(
      jsonRequest("/api/game/roll", {
        gameId: created.gameId,
        player,
      }),
    );

    expect(secondRollResponse.status).toBe(409);
    expect(await readJson(secondRollResponse)).toMatchObject({
      error: {
        code: "ROLL_ALREADY_STARTED",
      },
    });
  });

  it("rerolls with hold mask and increments roll count", async () => {
    const createResponse = await createGame(
      jsonRequest("/api/game/create", {
        player,
        rewardRecipient,
        bossId: 1,
      }),
    );
    const created = await readJson<{ gameId: string }>(createResponse);

    await rollGame(
      jsonRequest("/api/game/roll", {
        gameId: created.gameId,
        player,
      }),
    );

    const rerollResponse = await rerollGame(
      jsonRequest("/api/game/reroll", {
        gameId: created.gameId,
        player,
        holdMask: 19,
      }),
    );

    expect(rerollResponse.status).toBe(200);
    expect(await readJson(rerollResponse)).toMatchObject({
      gameId: created.gameId,
      turn: 1,
      rollCount: 2,
      dice: rerolledDice,
    });
    expect(rerollWithMaskMock).toHaveBeenCalledWith(initialDice, 19);
  });

  it("rejects invalid holdMask values", async () => {
    const createResponse = await createGame(
      jsonRequest("/api/game/create", {
        player,
        rewardRecipient,
        bossId: 1,
      }),
    );
    const created = await readJson<{ gameId: string }>(createResponse);

    await rollGame(
      jsonRequest("/api/game/roll", {
        gameId: created.gameId,
        player,
      }),
    );

    const tooLargeResponse = await rerollGame(
      jsonRequest("/api/game/reroll", {
        gameId: created.gameId,
        player,
        holdMask: 32,
      }),
    );

    expect(tooLargeResponse.status).toBe(400);
    expect(await readJson(tooLargeResponse)).toMatchObject({
      error: {
        code: "INVALID_HOLD_MASK",
      },
    });

    const negativeResponse = await rerollGame(
      jsonRequest("/api/game/reroll", {
        gameId: created.gameId,
        player,
        holdMask: -1,
      }),
    );

    expect(negativeResponse.status).toBe(400);
    expect(await readJson(negativeResponse)).toMatchObject({
      error: {
        code: "INVALID_HOLD_MASK",
      },
    });
  });

  it("finalizes a rolled round and blocks later rerolls", async () => {
    const createResponse = await createGame(
      jsonRequest("/api/game/create", {
        player,
        rewardRecipient,
        bossId: 1,
      }),
    );
    const created = await readJson<{ gameId: string }>(createResponse);

    await rollGame(
      jsonRequest("/api/game/roll", {
        gameId: created.gameId,
        player,
      }),
    );

    const finalizeResponse = await finalizeGame(
      jsonRequest("/api/game/finalize", {
        gameId: created.gameId,
        player,
        rewardRecipient,
      }),
    );

    expect(finalizeResponse.status).toBe(200);
    const proof = await readJson<{
      gameId: string;
      player: string;
      rewardRecipient: string;
      turn: number;
      finalRollCount: number;
      dice: number[];
      expiry: number;
      chainId: number;
      verifyingContract: string;
      backendSig: string;
    }>(finalizeResponse);

    expect(proof).toMatchObject({
      gameId: created.gameId,
      player,
      rewardRecipient,
      turn: 1,
      finalRollCount: 1,
      dice: initialDice,
      chainId: 84532,
      verifyingContract: ZERO_ADDRESS,
    });
    expect(proof.expiry).toBeGreaterThan(0);
    expect(proof.backendSig).toMatch(/^0x[a-f0-9]{130}$/);

    const rerollResponse = await rerollGame(
      jsonRequest("/api/game/reroll", {
        gameId: created.gameId,
        player,
        holdMask: 3,
      }),
    );

    expect(rerollResponse.status).toBe(409);
    expect(await readJson(rerollResponse)).toMatchObject({
      error: {
        code: "ROUND_FINALIZED",
      },
    });
  });

  it("rejects finalize before any roll", async () => {
    const createResponse = await createGame(
      jsonRequest("/api/game/create", {
        player,
        rewardRecipient,
        bossId: 1,
      }),
    );
    const created = await readJson<{ gameId: string }>(createResponse);

    const response = await finalizeGame(
      jsonRequest("/api/game/finalize", {
        gameId: created.gameId,
        player,
        rewardRecipient,
      }),
    );

    expect(response.status).toBe(409);
    expect(await readJson(response)).toMatchObject({
      error: {
        code: "ROLL_NOT_STARTED",
      },
    });
  });

  it("returns 404 for unknown game ids", async () => {
    const response = await rollGame(
      jsonRequest("/api/game/roll", {
        gameId: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        player,
      }),
    );

    expect(response.status).toBe(404);
    expect(await readJson(response)).toMatchObject({
      error: {
        code: "GAME_NOT_FOUND",
      },
    });
  });

  it("advances the backend round cache for the next roll", async () => {
    const createResponse = await createGame(
      jsonRequest("/api/game/create", {
        player,
        rewardRecipient,
        bossId: 1,
      }),
    );
    const created = await readJson<{ gameId: string }>(createResponse);

    await rollGame(
      jsonRequest("/api/game/roll", {
        gameId: created.gameId,
        player,
      }),
    );

    const advanceResponse = await advanceGame(
      jsonRequest("/api/game/advance", {
        gameId: created.gameId,
        player,
        nextTurn: 2,
      }),
    );

    expect(advanceResponse.status).toBe(200);
    expect(await readJson(advanceResponse)).toMatchObject({
      gameId: created.gameId,
      turn: 2,
      rollCount: 0,
    });

    const secondRollResponse = await rollGame(
      jsonRequest("/api/game/roll", {
        gameId: created.gameId,
        player,
      }),
    );

    expect(secondRollResponse.status).toBe(200);
    expect(await readJson(secondRollResponse)).toMatchObject({
      gameId: created.gameId,
      turn: 2,
      rollCount: 1,
      dice: initialDice,
    });
  });
});
