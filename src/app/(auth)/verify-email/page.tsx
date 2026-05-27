"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/form-field";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api/client";
import { useApi } from "@/hooks/use-api";
import { useAuthStore } from "@/lib/auth/store";
import type { ApiResponse, User } from "@/lib/types";

type VerifyResponse = ApiResponse<{
  accessToken: string;
  refreshToken: string;
}>;

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const mode = searchParams.get("mode");
  const tempToken = searchParams.get("tempToken") || "";
  const email = searchParams.get("email") || "";

  const is2FA = mode === "2fa";

  const { loading, error, execute } = useApi<VerifyResponse>();
  const {
    loading: resendLoading,
    error: resendError,
    execute: executeResend,
  } = useApi<ApiResponse<unknown>>();

  const [code, setCode] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const validate = () => {
    if (!code.trim()) {
      setFieldError("Code is required");
      return false;
    }
    if (!/^\d{6}$/.test(code)) {
      setFieldError("Code must be 6 digits");
      return false;
    }
    setFieldError("");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (is2FA) {
      const result = await execute(
        apiFetch<VerifyResponse>("/auth/verify-2fa", {
          method: "POST",
          body: JSON.stringify({ tempToken, code, trustDevice: true }),
        })
      );
      if (!result) return;
      const { accessToken, refreshToken } = result.data;
      const meRes = await apiFetch<ApiResponse<User>>("/auth/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      useAuthStore.getState().setAuth(meRes.data, { accessToken, refreshToken });
      router.push("/dashboard");
    } else {
      const result = await execute(
        apiFetch<VerifyResponse>("/auth/verify-email", {
          method: "POST",
          body: JSON.stringify({ token: code, email }),
        })
      );
      if (!result) return;
      const { accessToken, refreshToken } = result.data;
      const meRes = await apiFetch<ApiResponse<User>>("/auth/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      useAuthStore.getState().setAuth(meRes.data, { accessToken, refreshToken });
      router.push("/dashboard");
    }
  };

  const handleResend = async () => {
    setSuccessMessage("");
    if (is2FA) {
      if (!tempToken) return;
      const result = await executeResend(
        apiFetch<ApiResponse<unknown>>("/auth/resend-2fa", {
          method: "POST",
          body: JSON.stringify({ tempToken }),
        })
      );
      if (result) setSuccessMessage("A new code has been sent.");
    } else {
      if (!email) return;
      const result = await executeResend(
        apiFetch<ApiResponse<unknown>>("/auth/resend-verification", {
          method: "POST",
          body: JSON.stringify({ email }),
        })
      );
      if (result) setSuccessMessage("A new verification code has been sent.");
    }
  };

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">
          {is2FA ? "Two-Factor Authentication" : "Verify Email"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          {resendError && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {resendError}
            </div>
          )}
          {successMessage && (
            <div className="rounded-lg bg-primary/10 p-3 text-sm text-primary">
              {successMessage}
            </div>
          )}

          <p className="text-sm text-muted-foreground text-center">
            {is2FA
              ? "Enter the 6-digit code from your authenticator app."
              : `Enter the 6-digit code sent to ${email || "your email"}.`}
          </p>

          <FormField
            label="6-Digit Code"
            name="code"
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            error={fieldError}
          />

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Verifying..." : "Verify"}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={resendLoading}
            onClick={handleResend}
          >
            {resendLoading ? "Sending..." : "Resend Code"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/login" className="text-primary hover:underline">
            Back to login
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4 mx-auto" />
          <Skeleton className="h-40 w-full" />
        </div>
      }
    >
      <VerifyEmailForm />
    </Suspense>
  );
}
