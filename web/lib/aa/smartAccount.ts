export async function enableSessionKey(input: {
  ownerEoa: `0x${string}`;
  smartAccount: `0x${string}`;
  gameId: string;
  gameContract: `0x${string}`;
  validUntil: number;
  allowedSelectors: `0x${string}`[];
}) {
  throw new Error(
    `Session key setup is not implemented yet for smart account ${input.smartAccount}.`,
  );
}

export async function revokeSessionKey(gameId: string) {
  throw new Error(`Session key revoke is not implemented yet for game ${gameId}.`);
}
