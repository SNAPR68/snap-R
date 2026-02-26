"use client";

import { SessionProvider } from "./providers/session-provider";
import { RevenueCatProvider } from "./providers/revenuecat-provider";
import { AnalyticsIdentifier } from "@/components/analytics-identifier";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <RevenueCatProvider>
        <AnalyticsIdentifier />
        {children}
      </RevenueCatProvider>
    </SessionProvider>
  );
}
