"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { createGameSession } from "@/lib/api/backend";
import { DEMO_PLAYER, DEMO_REWARD_RECIPIENT } from "@/lib/game/demo";

const sections = [
  "经典 13 槽快艇骰子",
  "后端权威 roll / reroll",
  "本地乐观 CAST 伤害",
  "轻 ProtoMon 战斗包装",
] as const;

export default function Home() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isNavigating, startTransition] = useTransition();
  const [isCreating, setIsCreating] = useState(false);

  async function handleStartBattle() {
    setErrorMessage(null);
    setIsCreating(true);

    try {
      const session = await createGameSession({
        player: DEMO_PLAYER,
        rewardRecipient: DEMO_REWARD_RECIPIENT,
        bossId: 1,
      });

      startTransition(() => {
        router.push(`/battle/${session.gameId}`);
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to create a demo game.");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <main className="min-h-screen px-6 py-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <section className="rounded-[32px] border border-white/12 bg-white/6 p-8 shadow-2xl shadow-black/25 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-200/80">
            ProtoMon / Demo Start
          </p>
          <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-6xl">
                Classic Yahtzee, ProtoMon wrapper
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                这一版先把经典快艇骰子真正玩起来。骰面由后端权威生成，战斗页负责锁骰、重摇、槽位结算和本地 Boss
                掉血演出，ProtoMon 只做轻度怪物包装。
              </p>
              <p className="mt-4 text-xs uppercase tracking-[0.18em] text-slate-500">
                Demo player: {DEMO_PLAYER}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleStartBattle}
                disabled={isCreating || isNavigating}
                className="rounded-full bg-cyan-300 px-5 py-3 text-sm font-medium text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCreating || isNavigating ? "Creating Battle..." : "Start Demo Battle"}
              </button>
              <div className="rounded-full border border-white/12 px-5 py-3 text-sm text-slate-200">
                Upstash dealer online
              </div>
            </div>
          </div>

          {errorMessage ? (
            <div className="mt-6 rounded-2xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              {errorMessage}
            </div>
          ) : null}
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {sections.map((section) => (
            <article
              key={section}
              className="rounded-[24px] border border-white/10 bg-slate-950/45 p-5"
            >
              <p className="text-sm font-medium text-white">{section}</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                本轮聚焦经典快艇骰子体验，链上裁决和 session key 在后续阶段接入。
              </p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
