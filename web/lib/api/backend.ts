import type {
  AdvanceRoundInput,
  AdvanceRoundResult,
  ConfirmRoundInput,
  ConfirmRoundResult,
  CreateGameSessionInput,
  CreateGameSessionResult,
  DealerProof,
  FinalizeRoundInput,
  RollbackRoundInput,
  RollbackRoundResult,
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
    const errorPayload = (await response.json().catch(() => null)) as
      | {
          error?: {
            message?: string;
          };
        }
      | null;

    throw new Error(errorPayload?.error?.message ?? `${path} returned ${response.status}`);
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

export function finalizeRound(input: FinalizeRoundInput) {
  return postJson<DealerProof>("/api/game/finalize", input);
}

export function advanceRound(input: AdvanceRoundInput) {
  return postJson<AdvanceRoundResult>("/api/game/advance", input);
}

export function confirmRound(input: ConfirmRoundInput) {
  return postJson<ConfirmRoundResult>("/api/game/confirm", input);
}

export function rollbackRound(input: RollbackRoundInput) {
  return postJson<RollbackRoundResult>("/api/game/rollback", input);
}
