"use client";

import posthog from "posthog-js";
import { PostHogProvider as CSPostHogProvider } from "posthog-js/react";
import { useEffect, type ReactNode } from "react";

export function PostHogProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (typeof window !== "undefined") {
      const phKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
      const phHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

      if (phKey && phHost) {
        posthog.init(phKey, {
          api_host: phHost,
          // Capture pageview manually or optimally using Next.js hooks if deeply routed,
          // but for this MVP mostly on the root page, the default auto-capture works.
          person_profiles: "identified_only", 
        });

        // Add custom super property so events from this codebase 
        // are cleanly segregated from other websites on the same PostHog project
        posthog.register({
          site: "ProtoMon-Yahtzee"
        });
      }
    }
  }, []);

  return <CSPostHogProvider client={posthog}>{children}</CSPostHogProvider>;
}
