"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";

type AppProviderProps = {
  children: React.ReactNode;
};

export function AppProvider({ children }: AppProviderProps) {
  return (
    <SessionProvider>
      {children}
      <Toaster richColors position="top-right" />
    </SessionProvider>
  );
}

