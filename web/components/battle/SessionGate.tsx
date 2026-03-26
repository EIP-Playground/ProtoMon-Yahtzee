"use client";

import { useLocale } from "@/components/providers/LocaleProvider";

type SessionGateProps = {
  gameId: string;
  children: React.ReactNode;
};

export function SessionGate({ gameId, children }: SessionGateProps) {
  const { messages } = useLocale();

  return (
    <section className="rounded-[32px] border border-white/10 bg-slate-900/35 p-4 shadow-2xl shadow-black/20">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-white/8 bg-slate-950/45 px-4 py-3">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
            {messages.battle.session.eyebrow}
          </p>
          <p className="mt-1 text-sm text-slate-300">{messages.battle.session.description}</p>
        </div>
        <div className="rounded-full border border-cyan-200/15 bg-cyan-300/10 px-4 py-2 text-xs uppercase tracking-[0.18em] text-cyan-100">
          {gameId}
        </div>
      </div>

      <div className="mt-4">{children}</div>
    </section>
  );
}
