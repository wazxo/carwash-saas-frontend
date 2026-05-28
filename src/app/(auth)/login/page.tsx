"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/form-field";
import { apiFetch } from "@/lib/api/client";
import { useApi } from "@/hooks/use-api";
import { useAuthStore } from "@/lib/auth/store";
import { assertTokenPayload, unwrapAuthPayload } from "@/lib/auth/responses";
import type { ApiResponse, User } from "@/lib/types";

type LoginSuccessData = {
  accessToken: string;
  refreshToken: string;
};

type Login2FAData = {
  requiresTwoFactor: true;
  tempToken: string;
  message: string;
};

type LoginResponse = ApiResponse<LoginSuccessData | Login2FAData>;

export default function LoginPage() {
  const router = useRouter();
  const { loading, error, execute } = useApi<LoginResponse>();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!email.trim()) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errors.email = "Invalid email address";
    if (!password) errors.password = "Password is required";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const result = await execute(
      apiFetch<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
        auth: false,
        suppressAuthRedirect: true,
        suppressTokenRefresh: true,
      })
    );

    if (!result) return;

    const data = unwrapAuthPayload(result.data);

    if ("requiresTwoFactor" in data && data.requiresTwoFactor) {
      router.push(
        `/verify-email?mode=2fa&tempToken=${encodeURIComponent(data.tempToken)}`
      );
      return;
    }

    // Backend login only returns tokens — fetch user separately
    assertTokenPayload(data);
    const { accessToken, refreshToken } = data;
    const meRes = await apiFetch<ApiResponse<User>>("/auth/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
      auth: false,
      suppressAuthRedirect: true,
      suppressTokenRefresh: true,
    });
    useAuthStore.getState().setAuth(meRes.data, { accessToken, refreshToken });
    router.push("/dashboard");
  };

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Sign In</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <FormField
            label="Email"
            type="email"
            name="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={fieldErrors.email}
          />
          <FormField
            label="Password"
            type="password"
            name="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldErrors.password}
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="mt-4">
          <Button variant="outline" className="w-full" asChild>
            <a href="/api/auth/google">Sign in with Google</a>
          </Button>
        </div>

        <div className="mt-6 flex flex-col items-center gap-2 text-sm text-muted-foreground">
          <Link
            href="/forgot-password"
            className="text-primary hover:underline"
          >
            Forgot your password?
          </Link>
          <span>
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-primary hover:underline">
              Create one
            </Link>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
