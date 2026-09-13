"use client";

import { useEffect, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "@/lib/queryClient";

export default function Providers({ children }: { children: React.ReactNode }) {
  const isMockingDisabled = process.env.NEXT_PUBLIC_API_MOCKING === "off";
  // 개발 환경에서 MSW가 준비될 때까지 렌더를 잠깐 보류
  const [isMockReady, setIsMockReady] = useState(
    process.env.NODE_ENV !== "development" || isMockingDisabled,
  );

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    if (isMockingDisabled) return;

    const startMock = async () => {
      const { worker } = await import("@/mocks/browser");
      await worker.start({ onUnhandledRequest: "bypass" });
      setIsMockReady(true);
    };

    startMock();
  }, [isMockingDisabled]);

  if (!isMockReady) return null;

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
