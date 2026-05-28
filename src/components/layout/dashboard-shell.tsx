"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api/client";
import { useAuthStore } from "@/lib/auth/store";
import { Sidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";
import { MobileHeader } from "./mobile-header";
import { Skeleton } from "@/components/ui/skeleton";
import type { ApiResponse, User } from "@/lib/types";

export function DashboardShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function syncSession() {
      await new Promise((resolve) => setTimeout(resolve, 100));

      const store = useAuthStore.getState();
      if (!store.accessToken) {
        router.replace("/login");
        if (!cancelled) setChecked(true);
        return;
      }

      try {
        const meRes = await apiFetch<ApiResponse<User>>("/auth/me", {
          suppressAuthRedirect: true,
        });
        if (!cancelled) {
          store.setAuth(meRes.data, {
            accessToken: store.accessToken,
            refreshToken: store.refreshToken || "",
          });
        }
      } catch {
        useAuthStore.getState().clearAuth();
        router.replace("/login");
      } finally {
        if (!cancelled) setChecked(true);
      }
    }

    void syncSession();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="space-y-4 w-64">
          <Skeleton className="h-8 w-32 mx-auto" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4 mx-auto" />
        </div>
      </div>
    );
  }

  if (!accessToken) {
    return null; // redirecting
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <MobileHeader />
        <main className="flex-1 p-4 lg:p-8 pb-24 lg:pb-8 overflow-y-auto">
          {children}
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
