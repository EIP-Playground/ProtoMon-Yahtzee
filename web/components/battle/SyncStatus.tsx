"use client";

import { useLocale } from "@/components/providers/LocaleProvider";
import type { HexString, SyncStatus } from "@/types/game";

type SyncStatusPanelProps = {
  status: SyncStatus;
  message?: string;
  pendingTxHash?: HexString;
  redisKey: string;
  latestDiceRttMs: number | null;
};

export function SyncStatusPanel({
  status,
  message,
  pendingTxHash,
  redisKey,
  latestDiceRttMs,
}: SyncStatusPanelProps) {
  const { messages } = useLocale();

  return (
    <section className="rounded-[28px] border border-white/10 bg-white/6 p-6">
      <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/80">
        {messages.battle.sync.eyebrow}
      </p>
      <h2 className="mt-3 text-2xl font-semibold text-white">{messages.battle.sync.title}</h2>
      <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/45 p-4">
        <p className="text-sm font-medium text-white">{status}</p>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          {message ?? messages.battle.sync.statusCopy[status]}
        </p>
        <p className="mt-4 break-all text-xs text-slate-500">
          {pendingTxHash
            ? messages.battle.sync.pendingTxAssigned(pendingTxHash)
            : messages.battle.sync.pendingTxMissing}
        </p>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/35 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
          {messages.battle.sync.debug}
        </p>
        <p className="mt-3 break-all text-sm text-slate-200">
          {messages.battle.sync.redisKey(redisKey)}
        </p>
        <p className="mt-2 text-sm text-slate-300">{messages.battle.sync.latestDiceRtt(latestDiceRttMs)}</p>
        <p className="mt-3 text-xs leading-6 text-slate-500">{messages.battle.sync.storedFields}</p>
      </div>
    </section>
  );
}
