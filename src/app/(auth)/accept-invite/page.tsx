"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/form-field";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api/client";
import { useApi } from "@/hooks/use-api";
import { useAuthStore } from "@/lib/auth/store";
import { assertTokenPayload, unwrapAuthPayload } from "@/lib/auth/responses";
import type { ApiResponse, User } from "@/lib/types";

type AcceptInviteData = {
  user: User;
  accessToken: string;
  refreshToken: string;
};

type InvitePreview = {
  email: string;
  expiresAt: string;
  tenant?: { id: string; name: string };
  role?: { id: string; name: string };
  location?: { id: string; name: string } | null;
};

function AcceptInviteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const { loading, error, execute } = useApi<ApiResponse<AcceptInviteData>>();
  const [invitePreview, setInvitePreview] = useState<InvitePreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(Boolean(token));

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!token) return;

    void (async () => {
      try {
        const res = await apiFetch<{ data: InvitePreview }>(`/auth/invite-preview?token=${encodeURIComponent(token)}`, {
          headers: { Accept: "application/json" },
          auth: false,
          suppressAuthRedirect: true,
          suppressTokenRefresh: true,
        });
        setInvitePreview(res.data);
      } catch {
        setInvitePreview(null);
      } finally {
        setPreviewLoading(false);
      }
    })();

  }, [token]);

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!firstName.trim()) errors.firstName = "First name is required";
    if (!lastName.trim()) errors.lastName = "Last name is required";
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
    if (!token) return;

    const result = await execute(
      apiFetch<ApiResponse<AcceptInviteData>>("/auth/register-invite", {
        method: "POST",
        body: JSON.stringify({ token, firstName, lastName, password }),
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
    router.push("/dashboard");
  };

  if (!token) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Invalid Invite</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">
          <p>The invitation link is missing or expired.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Accept Invitation</CardTitle>
        </CardHeader>
        <CardContent>
          {previewLoading ? (
            <div className="mb-4 rounded-lg border border-border bg-card/40 p-4 text-sm text-muted-foreground">
              Loading invitation details...
            </div>
          ) : invitePreview ? (
            <div className="mb-4 rounded-lg border border-border bg-card/40 p-4 text-sm text-muted-foreground space-y-1">
              <p><span className="font-medium text-foreground">Team:</span> {invitePreview.tenant?.name || "Carwash team"}</p>
              <p><span className="font-medium text-foreground">Role:</span> {invitePreview.role?.name || "Team member"}</p>
              <p><span className="font-medium text-foreground">Location:</span> {invitePreview.location?.name || "Any location"}</p>
              <p><span className="font-medium text-foreground">Email:</span> {invitePreview.email}</p>
            </div>
          ) : null}

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
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating account..." : "Accept Invitation"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4 mx-auto" />
          <Skeleton className="h-40 w-full" />
        </div>
      }
    >
      <AcceptInviteForm />
    </Suspense>
  );
}
