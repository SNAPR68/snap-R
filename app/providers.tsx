"use client";

import { SessionProvider } from "./providers/session-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}

