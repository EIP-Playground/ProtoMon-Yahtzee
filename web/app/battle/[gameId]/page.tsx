import { BossPanel } from "@/components/battle/BossPanel";
import { DiceBoard } from "@/components/battle/DiceBoard";
import { ScoreBoard } from "@/components/battle/ScoreBoard";
import { SessionGate } from "@/components/battle/SessionGate";
import { SyncStatusPanel } from "@/components/battle/SyncStatus";
import { createInitialBattleState } from "@/store/battleStore";

type BattlePageProps = {
  params: Promise<{
    gameId: string;
  }>;
};

export default async function BattlePage({ params }: BattlePageProps) {
  const { gameId } = await params;
  const state = createInitialBattleState(gameId);

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="rounded-[28px] border border-white/10 bg-slate-950/50 p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/80">
            Battle Route
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
            ProtoMon Battle Shell
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            `gameId` 已接入动态路由。当前页面只展示战斗布局和状态占位，不会调用真实链路或 Redis。
          </p>
          <div className="mt-4 inline-flex rounded-full border border-cyan-200/20 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100">
            gameId: {gameId}
          </div>
        </header>

        <SessionGate gameId={gameId}>
          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="flex flex-col gap-6">
              <BossPanel state={state} />
              <DiceBoard dice={state.dice} locked={state.locked} rollCount={state.rollCount} />
            </div>
            <div className="flex flex-col gap-6">
              <SyncStatusPanel
                status={state.syncStatus}
                pendingTxHash={state.pendingTxHash}
              />
              <ScoreBoard usedSlots={state.usedSlots} />
            </div>
          </div>
        </SessionGate>
      </div>
    </main>
  );
}
