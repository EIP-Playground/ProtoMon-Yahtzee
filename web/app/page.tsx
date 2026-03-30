"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { useEffect, useState, useTransition } from "react";

import { BackToTopButton } from "@/components/home/BackToTopButton";
import { HomeLanding } from "@/components/home/HomeLanding";
import { LoadingPage } from "@/components/loading/LoadingPage";
import { useLocale } from "@/components/providers/LocaleProvider";
import { useSmartAccount } from "@/components/providers/SmartAccountProvider";
import {
  getConnectedSenderAddress,
  startGameOnChain,
  waitForGameStarted,
} from "@/lib/chain/gameContract";
import { createBattleSession } from "@/lib/game/session";
import { preloadBattleAssets } from "@/lib/ui/battleAssets";
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
  const { isAAEnabled, setupSmartAccount, smartAccountClient } = useSmartAccount();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isNavigating, startTransition] = useTransition();
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateLoading, setShowCreateLoading] = useState(false);
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
    setShowCreateLoading(false);
    setCreateReady(false);
    setPendingGameId(null);

    try {
      // Get the user's real EOA address (for rewardRecipient and fallback sender)
      const eoaAddress = await getConnectedSenderAddress();
      posthog.capture("game_start", {
        game_id: "yahtzee",
        mode: "standard",
      });

      let player = eoaAddress;
      let aaClient: unknown = undefined;

      if (isAAEnabled) {
        // AA mode: create ephemeral signer + Safe Smart Account
        const safeAddress = await setupSmartAccount();
        player = safeAddress;
        aaClient = smartAccountClient;

        // Re-read the client since setupSmartAccount triggers a state update
        // and the closure still holds the old reference. Dynamic import fallback:
        if (!aaClient) {
          const { getOrCreateEphemeralKey, setupGaslessAccount } =
            await import("@/lib/aa/smartAccount");
          const privKey = getOrCreateEphemeralKey();
          const result = await setupGaslessAccount(privKey);
          player = result.safeAddress;
          aaClient = result.smartAccountClient;
        }
      }

      const session = await createBattleSession({
        player,
        rewardRecipient: eoaAddress,
        bossId: 1,
      });

      setShowCreateLoading(true);
      const battleAssetsPromise = preloadBattleAssets();
      const minLoadingPromise = wait(LOADING_MIN_CREATE_DURATION_MS);

      const { txHash, isAA } = await startGameOnChain(
        {
          gameId: session.gameId,
          rewardRecipient: session.rewardRecipient,
          bossId: session.bossId,
        },
        aaClient,
      );

      // If AA is enabled, bind the ephemeral key to this gameId for battle page restore
      if (isAAEnabled) {
        try {
          const { getOrCreateEphemeralKey, bindEphemeralKeyToGame } =
            await import("@/lib/aa/smartAccount");
          const privKey = getOrCreateEphemeralKey();
          bindEphemeralKeyToGame(session.gameId, privKey);
        } catch {
          // Non-critical: battle page can still work if restore fails
        }
      }

      const chainStartedPromise = waitForGameStarted(txHash, isAA);

      await Promise.all([battleAssetsPromise, chainStartedPromise, minLoadingPromise]);

      setPendingGameId(session.gameId);
      setCreateReady(true);
    } catch (error) {
      setIsCreating(false);
      setShowCreateLoading(false);
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
      {showCreateLoading || isNavigating ? (
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
        heroTopControls={isCreating || isNavigating ? null : <HomeWalletHud />}
      />
      <BackToTopButton visible={showBackToTop} />
    </main>
  );
}
