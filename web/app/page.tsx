"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { BackToTopButton } from "@/components/home/BackToTopButton";
import { HomeLanding } from "@/components/home/HomeLanding";
import { LoadingPage } from "@/components/loading/LoadingPage";
import { useLocale } from "@/components/providers/LocaleProvider";
import { createGameSession } from "@/lib/api/backend";
import { DEMO_PLAYER, DEMO_REWARD_RECIPIENT } from "@/lib/game/demo";
import { LOADING_MIN_CREATE_DURATION_MS } from "@/lib/ui/loading";

const ENTRY_LOADING_KEY = "protomon:entry-loading:seen";
const HomeWalletHud = dynamic(
  () => import("@/components/home/HomeWalletHud").then((mod) => mod.HomeWalletHud),
  { ssr: false },
);

function wait(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export default function Home() {
  const router = useRouter();
  const { messages } = useLocale();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isNavigating, startTransition] = useTransition();
  const [isCreating, setIsCreating] = useState(false);
  const [createReady, setCreateReady] = useState(false);
  const [pendingGameId, setPendingGameId] = useState<string | null>(null);
  const [entryLoadingState, setEntryLoadingState] = useState<"checking" | "loading" | "ready">(
    "checking",
  );
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const hasSeenEntryLoading = window.sessionStorage.getItem(ENTRY_LOADING_KEY) === "1";

    if (hasSeenEntryLoading) {
      const timer = window.setTimeout(() => {
        setEntryLoadingState("ready");
      }, 0);

      return () => window.clearTimeout(timer);
    }

    window.sessionStorage.setItem(ENTRY_LOADING_KEY, "1");
    const timer = window.setTimeout(() => {
      setEntryLoadingState("loading");
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > window.innerHeight * 0.6);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  async function handleStartBattle() {
    setErrorMessage(null);
    setIsCreating(true);
    setCreateReady(false);
    setPendingGameId(null);

    const startedAt = performance.now();

    try {
      const session = await createGameSession({
        player: DEMO_PLAYER,
        rewardRecipient: DEMO_REWARD_RECIPIENT,
        bossId: 1,
      });

      const elapsed = performance.now() - startedAt;
      const remaining = Math.max(0, LOADING_MIN_CREATE_DURATION_MS - elapsed);

      if (remaining > 0) {
        await wait(remaining);
      }

      setPendingGameId(session.gameId);
      setCreateReady(true);
    } catch (error) {
      setIsCreating(false);
      setCreateReady(false);
      setPendingGameId(null);
      setErrorMessage(error instanceof Error ? error.message : messages.home.errorCreateGame);
    }
  }

  function handleCreateLoadingComplete() {
    if (!pendingGameId) {
      return;
    }

    startTransition(() => {
      router.push(`/battle/${pendingGameId}`);
    });
  }

  if (entryLoadingState === "checking") {
    return null;
  }

  if (entryLoadingState === "loading") {
    return (
      <LoadingPage
        mode="timed"
        duration={2800}
        title="PROTOMON"
        subtitle={messages.home.entrySubtitle}
        loadingLabel={messages.home.entryLoadingLabel}
        completeLabel={messages.home.entryCompleteLabel}
        onComplete={() => setEntryLoadingState("ready")}
      />
    );
  }

  return (
    <main className="min-h-screen bg-[#070d16]">
      {isCreating || isNavigating ? (
        <LoadingPage
          mode="pending"
          duration={LOADING_MIN_CREATE_DURATION_MS}
          ready={createReady}
          onComplete={handleCreateLoadingComplete}
          title="PROTOMON"
          subtitle={messages.home.createSubtitle}
          loadingLabel={messages.home.createLoadingLabel}
          completeLabel={messages.home.createCompleteLabel}
          messages={messages.home.createMessages}
        />
      ) : null}

      <HomeLanding
        errorMessage={errorMessage}
        isBusy={isCreating || isNavigating}
        onStartBattle={handleStartBattle}
        heroTopControls={<HomeWalletHud />}
      />
      <BackToTopButton visible={showBackToTop} />
    </main>
  );
}
