import Link from "next/link";

const sections = [
  "前端 Battle 页面骨架",
  "Next.js API 路由占位",
  "共享类型与游戏目录结构",
  "Redis 与链交互接线位",
] as const;

export default function Home() {
  return (
    <main className="min-h-screen px-6 py-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <section className="rounded-[32px] border border-white/12 bg-white/6 p-8 shadow-2xl shadow-black/25 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-200/80">
            ProtoMon / Web Init
          </p>
          <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-6xl">
                ProtoMon MVP web shell
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                这里是基于实现文档初始化出来的 Next.js 前后端一体骨架。当前阶段只完成可运行项目、页面入口、
                API 路由占位和 Redis/链交互接线位。
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/battle/demo-game"
                className="rounded-full bg-cyan-300 px-5 py-3 text-sm font-medium text-slate-950 transition hover:bg-cyan-200"
              >
                打开 Battle Shell
              </Link>
              <div className="rounded-full border border-white/12 px-5 py-3 text-sm text-slate-200">
                API / Redis Pending
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {sections.map((section) => (
            <article
              key={section}
              className="rounded-[24px] border border-white/10 bg-slate-950/45 p-5"
            >
              <p className="text-sm font-medium text-white">{section}</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                当前为初始化占位，后续功能会在这个骨架上分阶段接入。
              </p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
