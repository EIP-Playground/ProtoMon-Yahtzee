import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { execFileSync, spawn, type ChildProcess } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { computeLocalScore, getSlotScore } from "@/lib/game/scoring";
import { createInitialBattleState } from "@/store/battleStore";
import type { BattleState, DiceArray, DiceValue } from "@/types/game";

const WEB_ROOT = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(WEB_ROOT, "../..");
const RPC_PORT = 18545;
const RPC_URL = `http://127.0.0.1:${RPC_PORT}`;
const ANVIL_PRIVATE_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const DEALER_SIGNER = "0x000000000000000000000000000000000000dEaD";

function localCliEnv() {
  const env = { ...process.env };

  delete env.HTTP_PROXY;
  delete env.HTTPS_PROXY;
  delete env.http_proxy;
  delete env.https_proxy;
  delete env.ALL_PROXY;
  delete env.all_proxy;

  return env;
}

function runCli(command: string, args: string[], cwd = PROJECT_ROOT) {
  return execFileSync(command, args, {
    cwd,
    env: localCliEnv(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function deployContract(
  artifact: string,
  constructorArgs: string[] = [],
): `0x${string}` {
  const output = runCli("forge", [
    "create",
    artifact,
    "--broadcast",
    "--rpc-url",
    RPC_URL,
    "--private-key",
    ANVIL_PRIVATE_KEY,
    ...(constructorArgs.length > 0 ? ["--constructor-args", ...constructorArgs] : []),
  ]);

  const addressMatch = output.match(/Deployed to:\s*(0x[a-fA-F0-9]{40})/);

  if (!addressMatch) {
    throw new Error(`Could not parse deployment address from forge output:\n${output}`);
  }

  return addressMatch[1] as `0x${string}`;
}

async function waitForRpc() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(RPC_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "eth_blockNumber",
          params: [],
        }),
      });

      if (response.ok) {
        const payload = (await response.json()) as { result?: string };

        if (typeof payload.result === "string") {
          return;
        }
      }
    } catch {}

    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  throw new Error("Timed out waiting for local Anvil RPC");
}

function encodeWord(value: number | bigint | boolean) {
  const normalized =
    typeof value === "boolean" ? (value ? BigInt(1) : BigInt(0)) : BigInt(value);
  return normalized.toString(16).padStart(64, "0");
}

function buildPreviewAllScoresCallData(
  selector: `0x${string}`,
  dice: DiceArray,
) {
  const encodedDice = dice.map((value) => encodeWord(value)).join("");
  return `${selector}${encodedDice}` as `0x${string}`;
}

function buildPreviewUpperStateCallData(
  selector: `0x${string}`,
  dice: DiceArray,
  upperSubtotal: number,
  upperBonusClaimed: boolean,
) {
  const encodedDice = dice.map((value) => encodeWord(value)).join("");
  const encodedUpperSubtotal = encodeWord(upperSubtotal);
  const encodedUpperBonusClaimed = encodeWord(upperBonusClaimed);

  return `${selector}${encodedDice}${encodedUpperSubtotal}${encodedUpperBonusClaimed}` as `0x${string}`;
}

async function ethCall(to: `0x${string}`, data: `0x${string}`) {
  const response = await fetch(RPC_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_call",
      params: [{ to, data }, "latest"],
    }),
  });

  const payload = (await response.json()) as {
    result?: `0x${string}`;
    error?: { message?: string };
  };

  if (!response.ok || !payload.result) {
    throw new Error(
      `eth_call failed: ${payload.error?.message ?? response.statusText}`,
    );
  }

  return payload.result;
}

function decodePreviewAllScoresResult(result: `0x${string}`) {
  const raw = result.slice(2);

  if (raw.length % 64 !== 0) {
    throw new Error(`Unexpected ABI payload length: ${result.length}`);
  }

  const words = raw.match(/.{64}/g) ?? [];

  if (words.length !== 26) {
    throw new Error(`Expected 26 ABI words, got ${words.length}`);
  }

  const scores = words.slice(0, 13).map((word) => Number(BigInt(`0x${word}`)));
  const qualifies = words
    .slice(13, 26)
    .map((word) => BigInt(`0x${word}`) !== BigInt(0));

  return { scores, qualifies };
}

function decodePreviewUpperStateResult(result: `0x${string}`) {
  const raw = result.slice(2);

  if (raw.length % 64 !== 0) {
    throw new Error(`Unexpected ABI payload length: ${result.length}`);
  }

  const words = raw.match(/.{64}/g) ?? [];

  if (words.length !== 24) {
    throw new Error(`Expected 24 ABI words, got ${words.length}`);
  }

  const slotScores = words.slice(0, 6).map((word) => Number(BigInt(`0x${word}`)));
  const totalDamages = words.slice(6, 12).map((word) => Number(BigInt(`0x${word}`)));
  const nextUpperSubtotals = words
    .slice(12, 18)
    .map((word) => Number(BigInt(`0x${word}`)));
  const nextUpperBonusClaimedFlags = words
    .slice(18, 24)
    .map((word) => BigInt(`0x${word}`) !== BigInt(0));

  return {
    slotScores,
    totalDamages,
    nextUpperSubtotals,
    nextUpperBonusClaimedFlags,
  };
}

function generateUnorderedDiceCombinations(): DiceArray[] {
  const combinations: DiceArray[] = [];

  for (let a = 1; a <= 6; a += 1) {
    for (let b = a; b <= 6; b += 1) {
      for (let c = b; c <= 6; c += 1) {
        for (let d = c; d <= 6; d += 1) {
          for (let e = d; e <= 6; e += 1) {
            combinations.push([
              a as DiceValue,
              b as DiceValue,
              c as DiceValue,
              d as DiceValue,
              e as DiceValue,
            ]);
          }
        }
      }
    }
  }

  return combinations;
}

function toTsQualifies(slotId: number, slotScore: number) {
  return slotId === 12 ? true : slotScore > 0;
}

type Mismatch = {
  dice: DiceArray;
  slotId: number;
  tsScore: number;
  solScore: number;
  tsQualifies: boolean;
  solQualifies: boolean;
};

type UpperBonusMismatch = {
  dice: DiceArray;
  slotId: number;
  upperSubtotal: number;
  upperBonusClaimed: boolean;
  tsSlotScore: number;
  solSlotScore: number;
  tsBonusDamage: number;
  solBonusDamage: number;
  tsTotalDamage: number;
  solTotalDamage: number;
  tsNextUpperSubtotal: number;
  solNextUpperSubtotal: number;
  tsNextUpperBonusClaimed: boolean;
  solNextUpperBonusClaimed: boolean;
};

function createParityBattleState(
  upperSubtotal: number,
  upperBonusClaimed: boolean,
): BattleState {
  return {
    ...createInitialBattleState("parity"),
    upperSubtotalLocal: upperSubtotal,
    upperBonusClaimedLocal: upperBonusClaimed,
  };
}

describe("TS and Solidity slot-score parity", () => {
  let anvilProcess: ChildProcess | null = null;
  let previewHarnessAddress: `0x${string}`;
  let previewAllScoresSelector: `0x${string}`;
  let previewUpperStateSelector: `0x${string}`;

  beforeAll(async () => {
    anvilProcess = spawn(
      "anvil",
      ["--host", "127.0.0.1", "--port", String(RPC_PORT)],
      {
        cwd: PROJECT_ROOT,
        env: localCliEnv(),
        stdio: ["ignore", "pipe", "pipe"],
      },
    );

    await waitForRpc();

    const gameAddress = deployContract(
      "contracts/origin/ProtoMonGame.sol:ProtoMonGame",
      [DEALER_SIGNER],
    );

    previewHarnessAddress = deployContract(
      "contracts/dev/ProtoMonGamePreviewHarness.sol:ProtoMonGamePreviewHarness",
      [gameAddress],
    );

    previewAllScoresSelector = runCli("cast", [
      "sig",
      "previewAllScores(uint8[5])",
    ]) as `0x${string}`;
    previewUpperStateSelector = runCli("cast", [
      "sig",
      "previewUpperState(uint8[5],uint16,bool)",
    ]) as `0x${string}`;
  });

  afterAll(() => {
    if (!anvilProcess) {
      return;
    }

    anvilProcess.kill("SIGTERM");
    anvilProcess = null;
  });

  it("matches all 252 unordered dice combinations across all 13 slots", async () => {
    const combinations = generateUnorderedDiceCombinations();
    const mismatches: Mismatch[] = [];

    expect(combinations).toHaveLength(252);

    for (const dice of combinations) {
      const callData = buildPreviewAllScoresCallData(previewAllScoresSelector, dice);
      const encodedResult = await ethCall(previewHarnessAddress, callData);
      const { scores, qualifies } = decodePreviewAllScoresResult(encodedResult);

      for (let slotId = 0; slotId < 13; slotId += 1) {
        const tsScore = getSlotScore(slotId, dice);
        const tsQualifies = toTsQualifies(slotId, tsScore);
        const solScore = scores[slotId];
        const solQualifies = qualifies[slotId];

        if (tsScore !== solScore || tsQualifies !== solQualifies) {
          mismatches.push({
            dice,
            slotId,
            tsScore,
            solScore,
            tsQualifies,
            solQualifies,
          });
        }
      }
    }

    expect(mismatches).toEqual([]);
  });

  it.skip("matches upper-bonus state transitions across boundary states for all unordered dice combinations", async () => {
    const combinations = generateUnorderedDiceCombinations();
    const upperSubtotals = [0, 57, 58, 59, 60, 61, 62, 63, 64];
    const upperBonusClaimedStates = [false, true];
    const mismatches: UpperBonusMismatch[] = [];

    for (const dice of combinations) {
      for (const upperSubtotal of upperSubtotals) {
        for (const upperBonusClaimed of upperBonusClaimedStates) {
          const state = createParityBattleState(upperSubtotal, upperBonusClaimed);
          const callData = buildPreviewUpperStateCallData(
            previewUpperStateSelector,
            dice,
            upperSubtotal,
            upperBonusClaimed,
          );
          const encodedResult = await ethCall(previewHarnessAddress, callData);
          const {
            slotScores,
            totalDamages,
            nextUpperSubtotals,
            nextUpperBonusClaimedFlags,
          } = decodePreviewUpperStateResult(encodedResult);

          for (let slotId = 0; slotId < 6; slotId += 1) {
            const tsResult = computeLocalScore(slotId, dice, state);
            const solSlotScore = slotScores[slotId];
            const solTotalDamage = totalDamages[slotId];
            const solBonusDamage = solTotalDamage - solSlotScore;
            const solNextUpperSubtotal = nextUpperSubtotals[slotId];
            const solNextUpperBonusClaimed = nextUpperBonusClaimedFlags[slotId];

            if (
              tsResult.slotScore !== solSlotScore ||
              tsResult.bonusDamage !== solBonusDamage ||
              tsResult.totalDamage !== solTotalDamage ||
              tsResult.nextUpperSubtotal !== solNextUpperSubtotal ||
              tsResult.nextUpperBonusClaimed !== solNextUpperBonusClaimed
            ) {
              mismatches.push({
                dice,
                slotId,
                upperSubtotal,
                upperBonusClaimed,
                tsSlotScore: tsResult.slotScore,
                solSlotScore,
                tsBonusDamage: tsResult.bonusDamage,
                solBonusDamage,
                tsTotalDamage: tsResult.totalDamage,
                solTotalDamage,
                tsNextUpperSubtotal: tsResult.nextUpperSubtotal,
                solNextUpperSubtotal,
                tsNextUpperBonusClaimed: tsResult.nextUpperBonusClaimed,
                solNextUpperBonusClaimed,
              });
            }
          }
        }
      }
    }

    expect(mismatches).toEqual([]);
  });
});
