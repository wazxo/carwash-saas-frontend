"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/form-field";
import { apiFetch } from "@/lib/api/client";
import { useApi } from "@/hooks/use-api";
import { useAuthStore } from "@/lib/auth/store";
import { assertTokenPayload, unwrapAuthPayload } from "@/lib/auth/responses";
import type { ApiResponse, User } from "@/lib/types";

type RegisterData = {
  user: User;
  accessToken: string;
  refreshToken: string;
  message: string;
};

type RegisterResponse = ApiResponse<RegisterData>;

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loading, error, execute } = useApi<RegisterResponse>();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [plan, setPlan] = useState(searchParams.get("plan") || "starter");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!firstName.trim()) errors.firstName = "First name is required";
    if (!lastName.trim()) errors.lastName = "Last name is required";
    if (!email.trim()) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errors.email = "Invalid email address";
    if (!password) errors.password = "Password is required";
    else if (password.length < 6)
      errors.password = "Password must be at least 6 characters";
    if (password !== confirmPassword)
      errors.confirmPassword = "Passwords do not match";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const result = await execute(
      apiFetch<RegisterResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ firstName, lastName, email, password, plan }),
        auth: false,
        suppressAuthRedirect: true,
        suppressTokenRefresh: true,
      })
    );

    if (!result) return;

    const payload = unwrapAuthPayload(result.data);
    assertTokenPayload(payload);
    const { accessToken, refreshToken } = payload;
    const meRes = await apiFetch<ApiResponse<User>>("/auth/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
      auth: false,
      suppressAuthRedirect: true,
      suppressTokenRefresh: true,
    });
    useAuthStore.getState().setAuth(meRes.data, { accessToken, refreshToken });
    router.push(`/verify-email?email=${encodeURIComponent(email)}`);
  };

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Create Account</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="First Name"
              name="firstName"
              placeholder="John"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              error={fieldErrors.firstName}
            />
            <FormField
              label="Last Name"
              name="lastName"
              placeholder="Doe"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              error={fieldErrors.lastName}
            />
          </div>
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
          <FormField
            label="Confirm Password"
            type="password"
            name="confirmPassword"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={fieldErrors.confirmPassword}
          />
          <div className="space-y-2">
            <label className="text-sm font-medium">Starting Plan</label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                ["starter", "Starter", "$49/mo", "1 location + 5 staff"],
                ["pro", "Pro", "$99/mo", "3 locations + unlimited staff"],
                ["enterprise", "Enterprise", "Custom", "Chains and franchises"],
              ].map(([value, title, price, subtitle]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPlan(value)}
                  className={`rounded-lg border p-4 text-left transition-colors ${
                    plan === value
                      ? "border-primary bg-primary/10"
                      : "border-border bg-background hover:border-primary/40"
                  }`}
                >
                  <div className="font-medium">{title}</div>
                  <div className="text-sm text-primary">{price}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{subtitle}</div>
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Every self-serve plan starts with a 14-day trial.
            </p>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
