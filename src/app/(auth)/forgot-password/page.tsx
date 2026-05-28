"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/form-field";
import { apiFetch } from "@/lib/api/client";
import { useApi } from "@/hooks/use-api";
import type { ApiResponse } from "@/lib/types";

export default function ForgotPasswordPage() {
  const { loading, error, execute } = useApi<ApiResponse<{ message?: string }>>();
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setFieldError("Email is required");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFieldError("Invalid email address");
      return;
    }
    setFieldError("");

    await execute(
      apiFetch<ApiResponse<{ message?: string }>>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
        auth: false,
        suppressAuthRedirect: true,
        suppressTokenRefresh: true,
      })
    );

    setSubmitted(true);
  };

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Reset Password</CardTitle>
      </CardHeader>
      <CardContent>
        {submitted ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-primary/10 p-3 text-sm text-primary">
              If an account with that email exists, you will receive a password
              reset link shortly.
            </div>
            <div className="text-center text-sm text-muted-foreground">
              <Link href="/login" className="text-primary hover:underline">
                Back to login
              </Link>
            </div>
          </div>
        ) : (
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
              error={fieldError}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              <Link href="/login" className="text-primary hover:underline">
                Remember your password? Sign in
              </Link>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
