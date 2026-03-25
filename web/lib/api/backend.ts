import type {
  CreateGameSessionInput,
  CreateGameSessionResult,
  DealerProof,
  RerollDiceInput,
  RerollDiceResult,
  RollDiceInput,
  RollDiceResult,
} from "@/types/game";

async function postJson<TResponse>(path: string, body: unknown) {
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`${path} returned ${response.status}`);
  }

  return (await response.json()) as TResponse;
}

export function createGameSession(input: CreateGameSessionInput) {
  return postJson<CreateGameSessionResult>("/api/game/create", input);
}

export function rollDice(input: RollDiceInput) {
  return postJson<RollDiceResult>("/api/game/roll", input);
}

export function rerollDice(input: RerollDiceInput) {
  return postJson<RerollDiceResult>("/api/game/reroll", input);
}

export function finalizeRound(input: {
  gameId: string;
  player: `0x${string}`;
  rewardRecipient: `0x${string}`;
}) {
  return postJson<DealerProof>("/api/game/finalize", input);
}
