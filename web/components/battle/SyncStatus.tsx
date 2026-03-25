import type { HexString, SyncStatus } from "@/types/game";

type SyncStatusPanelProps = {
  status: SyncStatus;
  message?: string;
  pendingTxHash?: HexString;
  redisKey: string;
  latestDiceRttMs: number | null;
};

const statusCopy: Record<SyncStatus, string> = {
  LOCAL_APPLIED: "本地乐观结算已应用。",
  PENDING_CHAIN: "等待链上回执确认。",
  CONFIRMED: "链上与本地状态一致。",
  RETRYABLE_FAIL: "提交失败，可重试。",
  ROLLBACK: "链上结果与本地不一致，已回滚。",
};

export function SyncStatusPanel({
  status,
  message,
  pendingTxHash,
  redisKey,
  latestDiceRttMs,
}: SyncStatusPanelProps) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-white/6 p-6">
      <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/80">Sync</p>
      <h2 className="mt-3 text-2xl font-semibold text-white">Settlement Status</h2>
      <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/45 p-4">
        <p className="text-sm font-medium text-white">{status}</p>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          {message ?? statusCopy[status]}
        </p>
        <p className="mt-4 break-all text-xs text-slate-500">
          {pendingTxHash ? `pendingTxHash: ${pendingTxHash}` : "pendingTxHash: not assigned"}
        </p>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/35 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Debug</p>
        <p className="mt-3 break-all text-sm text-slate-200">Redis key: {redisKey}</p>
        <p className="mt-2 text-sm text-slate-300">
          Latest dice RTT: {latestDiceRttMs === null ? "not sampled" : `${latestDiceRttMs} ms`}
        </p>
        <p className="mt-3 text-xs leading-6 text-slate-500">
          Stored fields: player, rewardRecipient, bossId, turn, rollCount, currentDice,
          finalized, createdAt, expiresAt
        </p>
      </div>
    </section>
  );
}
