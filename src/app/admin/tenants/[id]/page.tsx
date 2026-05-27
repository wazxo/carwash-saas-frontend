"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  ArrowLeft,
  Shield,
  Building2,
  HelpCircle,
  Users,
  MapPin,
  ShoppingCart,
  DollarSign,
} from "lucide-react";

type TenantMember = {
  id: string;
  user: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
  };
  role: {
    id: string;
    name: string;
  };
};

type TenantLocation = {
  id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  isActive?: boolean;
};

type TenantOrderStatus = {
  status: string;
  count: number;
};

type AdminTenantDetail = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  plan?: string | null;
  status?: string | null;
  createdAt: string;
  memberships: TenantMember[];
  locations: TenantLocation[];
  revenue: number;
  ordersByStatus: TenantOrderStatus[];
  _count: {
    customers: number;
    washOrders: number;
    services: number;
    appointments: number;
    employeeProfiles: number;
  };
};

const adminLinks = [
  { label: "Stats", href: "/admin", icon: LayoutDashboard },
  { label: "Tenants", href: "/admin/tenants", icon: Building2 },
  { label: "Audit Logs", href: "/admin/audit-logs", icon: Shield },
  { label: "Support Tickets", href: "/admin/support-tickets", icon: HelpCircle },
];

const statusTone: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  inactive: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
  suspended: "bg-red-500/15 text-red-400 border-red-500/20",
  trialing: "bg-blue-500/15 text-blue-400 border-blue-500/20",
};

export default function AdminTenantDetailPage() {
  const params = useParams<{ id: string }>();
  const tenantId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [tenant, setTenant] = useState<AdminTenantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState("free");
  const [status, setStatus] = useState("active");

  useEffect(() => {
    if (!tenantId) return;
    let cancelled = false;

    async function loadTenant() {
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch<{ data: AdminTenantDetail }>(
          `/admin/tenants/${tenantId}`
        );
        if (!cancelled) {
          setTenant(res.data);
          setPlan(res.data.plan || "free");
          setStatus(res.data.status || "active");
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load tenant detail"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadTenant();

    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  async function handleSave() {
    if (!tenantId) return;
    setSaving(true);
    setError(null);
    try {
      const res = await apiFetch<{ data: AdminTenantDetail }>(
        `/admin/tenants/${tenantId}/plan`,
        {
          method: "PATCH",
          body: JSON.stringify({ plan, status }),
        }
      );
      setTenant((current) =>
        current
          ? {
              ...current,
              plan: res.data.plan,
              status: res.data.status,
            }
          : current
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update tenant plan"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="flex items-center justify-between px-6 h-14">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to App
            </Link>
            <div className="h-6 w-px bg-border" />
            <nav className="flex items-center gap-1">
              {adminLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    link.href === "/admin/tenants"
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            <span className="font-semibold text-sm">Tenant Detail</span>
          </div>
        </div>
      </header>

      <main className="p-6 space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {loading ? "Tenant" : tenant?.name || "Tenant not found"}
            </h1>
            {!loading && tenant && (
              <p className="text-sm text-muted-foreground">
                {tenant.slug} • Created {new Date(tenant.createdAt).toLocaleDateString()}
              </p>
            )}
          </div>
          <Button asChild variant="outline">
            <Link href="/admin/tenants">Back to Tenants</Link>
          </Button>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {loading
            ? Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-28 w-full" />
              ))
            : tenant && [
                {
                  label: "Revenue",
                  value: `$${tenant.revenue.toLocaleString()}`,
                  icon: DollarSign,
                },
                {
                  label: "Customers",
                  value: tenant._count.customers,
                  icon: Users,
                },
                {
                  label: "Orders",
                  value: tenant._count.washOrders,
                  icon: ShoppingCart,
                },
                {
                  label: "Locations",
                  value: tenant.locations.length,
                  icon: MapPin,
                },
                {
                  label: "Employees",
                  value: tenant._count.employeeProfiles,
                  icon: Users,
                },
              ].map((stat) => (
                <Card key={stat.label}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                        <p className="text-2xl font-bold">{stat.value}</p>
                      </div>
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <stat.icon className="w-5 h-5 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tenant Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <Skeleton className="h-44 w-full" />
              ) : tenant ? (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className={statusTone[tenant.status || ""] || ""}>
                      {tenant.status || "unknown"}
                    </Badge>
                    <Badge variant="secondary" className="capitalize">
                      {tenant.plan || "free"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="mt-1 text-sm">{tenant.description || "No description provided."}</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Appointments</p>
                      <p className="text-lg font-semibold">{tenant._count.appointments}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Services</p>
                      <p className="text-lg font-semibold">{tenant._count.services}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Orders by status</p>
                    <div className="flex flex-wrap gap-2">
                      {tenant.ordersByStatus.length > 0 ? (
                        tenant.ordersByStatus.map((row) => (
                          <span
                            key={row.status}
                            className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
                          >
                            {row.status.replace(/_/g, " ")}: {row.count}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">No orders yet</span>
                      )}
                    </div>
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Plan And Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <Skeleton className="h-44 w-full" />
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Plan</label>
                    <select
                      className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={plan}
                      onChange={(e) => setPlan(e.target.value)}
                    >
                      <option value="free">Free</option>
                      <option value="starter">Starter</option>
                      <option value="pro">Pro</option>
                      <option value="business">Business</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <select
                      className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                      <option value="trialing">Trialing</option>
                    </select>
                  </div>
                  <Button onClick={handleSave} disabled={saving} className="w-full">
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Members</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-56 w-full" />
              ) : tenant && tenant.memberships.length > 0 ? (
                <div className="space-y-3">
                  {tenant.memberships.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-4 py-3"
                    >
                      <div>
                        <p className="font-medium">
                          {[member.user.firstName, member.user.lastName].filter(Boolean).join(" ") || member.user.email}
                        </p>
                        <p className="text-sm text-muted-foreground">{member.user.email}</p>
                      </div>
                      <Badge variant="secondary">{member.role.name}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-background/30 p-8 text-sm text-muted-foreground">
                  No members found.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Locations</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-56 w-full" />
              ) : tenant && tenant.locations.length > 0 ? (
                <div className="space-y-3">
                  {tenant.locations.map((location) => (
                    <div
                      key={location.id}
                      className="rounded-lg border border-border/60 bg-background/40 px-4 py-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium">{location.name}</p>
                        <Badge variant={location.isActive === false ? "secondary" : "default"}>
                          {location.isActive === false ? "Inactive" : "Active"}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {location.address || "No address"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {location.phone || "No phone"}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-background/30 p-8 text-sm text-muted-foreground">
                  No locations found.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
