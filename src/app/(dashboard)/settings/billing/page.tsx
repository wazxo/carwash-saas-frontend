"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api/client";
import { useAuthStore } from "@/lib/auth/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock3, Wallet } from "lucide-react";
import type { ApiResponse } from "@/lib/types";

type BillingSettings = {
  trialStartedAt?: string;
  trialEndsAt?: string;
  selectedPlan?: string;
};

type TenantBillingRecord = {
  id: string;
  name: string;
  plan?: string | null;
  status?: string | null;
  billingProvider?: string | null;
  paypalSubscriptionId?: string | null;
  paypalSubscriptionStatus?: string | null;
  trialStartedAt?: string | null;
  trialEndsAt?: string | null;
  billingActivatedAt?: string | null;
  settings?: BillingSettings;
};

const plans = [
  {
    id: "starter",
    name: "Starter",
    price: "$49/mo",
    description: "For a single-location wash with a small team.",
    features: ["1 location", "Up to 5 staff", "Unlimited orders", "Email support"],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$99/mo",
    description: "For growing operations that need appointments and more staff.",
    features: ["Up to 3 locations", "Unlimited staff", "Appointments", "Advanced reporting"],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    description: "For multi-site groups and franchise operators.",
    features: ["Unlimited locations", "Priority support", "Custom onboarding", "Operational consulting"],
  },
];

export default function BillingSettingsPage() {
  const { user } = useAuthStore();
  const searchParams = useSearchParams();
  const tenantId = user?.tenantId || null;
  const [tenant, setTenant] = useState<TenantBillingRecord | null>(null);
  const [selectedPlan, setSelectedPlan] = useState("starter");
  const [todayTimestamp] = useState(() => Date.now());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId) return;
    let cancelled = false;

    async function fetchBilling() {
      setLoading(true);
      try {
        const res = await apiFetch<ApiResponse<TenantBillingRecord>>(`/tenants/${tenantId}`);
        if (!cancelled) {
          setTenant(res.data);
          setSelectedPlan(res.data.plan || res.data.settings?.selectedPlan || "starter");
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load billing details");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchBilling();

    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  const paypalState = searchParams.get("paypal");
  const paypalSuccessMessage =
    paypalState === "success" ? "PayPal subscription approved successfully." : null;
  const paypalErrorMessage =
    paypalState === "cancel" ? "PayPal checkout was cancelled before approval." : null;

  const trialDaysRemaining = useMemo(() => {
    const trialEndsAt = tenant?.trialEndsAt || tenant?.settings?.trialEndsAt;
    if (!trialEndsAt) return null;
    const diffMs = new Date(trialEndsAt).getTime() - todayTimestamp;
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }, [tenant?.trialEndsAt, tenant?.settings?.trialEndsAt, todayTimestamp]);

  const trialStartedLabel = useMemo(() => {
    const value = tenant?.trialStartedAt || tenant?.settings?.trialStartedAt || tenant?.trialEndsAt || tenant?.settings?.trialEndsAt;
    return value ? new Date(value).toLocaleDateString() : null;
  }, [tenant?.trialStartedAt, tenant?.trialEndsAt, tenant?.settings?.trialStartedAt, tenant?.settings?.trialEndsAt]);

  const trialEndsLabel = useMemo(() => {
    const value = tenant?.trialEndsAt || tenant?.settings?.trialEndsAt;
    return value ? new Date(value).toLocaleDateString() : null;
  }, [tenant?.trialEndsAt, tenant?.settings?.trialEndsAt]);

  async function handleStartPayPalCheckout() {
    if (!user?.tenantId) {
      setError("Tenant context is missing for billing.");
      return;
    }
    setSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await apiFetch<{ data: { approvalUrl: string; subscriptionId: string } }>(`/billing/paypal/subscribe`, {
        method: "POST",
        body: JSON.stringify({ plan: selectedPlan }),
      });

      if (typeof window !== "undefined") {
        window.location.href = res.data.approvalUrl;
        return;
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start PayPal checkout");
    } finally {
      setSaving(false);
    }
  }

  if (!tenantId) {
    return <div className="p-8 text-sm text-destructive">No tenant context found for this account.</div>;
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 xl:grid-cols-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Wallet className="w-6 h-6 text-primary" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
          <p className="text-sm text-muted-foreground">
            Manage the current plan and track the trial state for {tenant?.name || "your business"}.
          </p>
        </div>
      </div>

      {(error || paypalErrorMessage) && <p className="text-sm text-destructive">{error || paypalErrorMessage}</p>}
      {(successMessage || paypalSuccessMessage) && <p className="text-sm text-emerald-400">{successMessage || paypalSuccessMessage}</p>}

      <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        <Card className="bg-card/60 border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Current Billing State</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-border/60 bg-background/40 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">Active plan</p>
                  <p className="text-xl font-semibold capitalize">{tenant?.plan || "starter"}</p>
                </div>
                <Badge variant={tenant?.status === "trialing" ? "default" : "secondary"}>
                  {tenant?.status || "active"}
                </Badge>
              </div>
            </div>

            <div className="rounded-xl border border-border/60 bg-background/40 p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Clock3 className="h-4 w-4 text-primary" />
                Trial Window
              </div>
              {trialEndsLabel ? (
                <div className="mt-3 space-y-1 text-sm">
                  <p className="text-muted-foreground">
                    Started {trialStartedLabel}
                  </p>
                  <p className="text-muted-foreground">
                    Ends {trialEndsLabel}
                  </p>
                  <p className="font-medium text-foreground">
                    {trialDaysRemaining === null
                      ? "No active trial"
                      : trialDaysRemaining > 0
                        ? `${trialDaysRemaining} day(s) remaining`
                        : "Trial ended"}
                  </p>
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">No trial window stored for this tenant.</p>
              )}
            </div>

            <div className="rounded-xl border border-border/60 bg-background/40 p-4 text-sm space-y-1">
              <p className="text-muted-foreground">Billing provider</p>
              <p className="font-medium capitalize">{tenant?.billingProvider || "paypal"}</p>
              <p className="text-muted-foreground">Subscription status</p>
              <p className="font-medium">{tenant?.paypalSubscriptionStatus || "No subscription yet"}</p>
              {tenant?.paypalSubscriptionId ? (
                <p className="text-xs text-muted-foreground font-mono">{tenant.paypalSubscriptionId}</p>
              ) : null}
            </div>

            <div className="rounded-xl border border-dashed border-border bg-background/30 p-4 text-sm text-muted-foreground">
                  PayPal Subscriptions is the payment flow for self-serve plans. When you continue, you will be redirected to PayPal to approve the recurring subscription.
                </div>
              </CardContent>
            </Card>

        <Card className="bg-card/60 border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`rounded-xl border p-5 text-left transition-colors ${
                    selectedPlan === plan.id
                      ? "border-primary bg-primary/10"
                      : "border-border bg-background hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{plan.name}</p>
                      <p className="text-sm text-primary">{plan.price}</p>
                    </div>
                    {selectedPlan === plan.id && <CheckCircle2 className="h-5 w-5 text-primary" />}
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{plan.description}</p>
                  <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                    {plan.features.map((feature) => (
                      <li key={feature}>• {feature}</li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Selected plan: <span className="font-medium text-foreground capitalize">{selectedPlan}</span>
              </p>
              {selectedPlan === "enterprise" ? (
                <Button asChild>
                  <a href="mailto:sales@washos.app?subject=Enterprise%20Plan%20for%20WashOS">
                    Contact Sales
                  </a>
                </Button>
              ) : (
                <Button onClick={handleStartPayPalCheckout} disabled={saving}>
                  {saving ? "Redirecting..." : "Continue with PayPal"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
