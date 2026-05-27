"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth/store";

export default function AuthLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (useAuthStore.getState().accessToken) {
        router.replace("/dashboard");
      }
      setChecked(true);
    }, 100);
    return () => clearTimeout(timer);
  }, [router]);

  if (!checked) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md animate-fade-in-up">
        {children}
      </div>
    </div>
  );
}
