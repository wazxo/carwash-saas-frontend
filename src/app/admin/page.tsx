"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LayoutDashboard,
  ArrowLeft,
  Shield,
  Users,
  Building2,
  ShoppingCart,
  DollarSign,
  MapPin,
  HelpCircle,
} from "lucide-react";

type AdminStatsResponse = {
  overview: {
    totalTenants: number;
    activeTenants: number;
    totalUsers: number;
    totalCustomers: number;
    totalLocations: number;
    totalEmployees: number;
    totalOrders: number;
    totalRevenue: number;
  };
  recentActivity: {
    newTenantsLast30Days: number;
    ordersLast30Days: number;
    revenueLast30Days: number;
  };
  plans: Array<{
    plan: string;
    count: number;
  }>;
};

const adminLinks = [
  { label: "Tenants", href: "/admin/tenants", icon: Building2 },
  { label: "Audit Logs", href: "/admin/audit-logs", icon: Shield },
  { label: "Support Tickets", href: "/admin/support-tickets", icon: HelpCircle },
];

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchStats() {
      try {
        const res = await apiFetch<{ data: AdminStatsResponse }>("/admin/stats");
        if (!cancelled) setStats(res.data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load stats");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchStats();

    return () => {
      cancelled = true;
    };
  }, []);

  const overview = stats?.overview;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="flex items-center justify-between px-6 h-14">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to App
            </Link>
            <div className="h-6 w-px bg-border" />
            <nav className="flex items-center gap-1">
              {adminLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-primary" />
            <span className="font-semibold text-sm">Admin</span>
          </div>
        </div>
      </header>

      <main className="p-6 space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>

        {loading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full" />
            ))}
          </div>
        )}

        {error && <p className="text-destructive text-sm">{error}</p>}

        {overview && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Total Tenants" value={overview.totalTenants} icon={Building2} />
              <StatCard label="Active Tenants" value={overview.activeTenants} icon={Building2} />
              <StatCard label="Total Users" value={overview.totalUsers} icon={Users} />
              <StatCard label="Customers" value={overview.totalCustomers} icon={Users} />
              <StatCard label="Locations" value={overview.totalLocations} icon={MapPin} />
              <StatCard label="Employees" value={overview.totalEmployees} icon={Users} />
              <StatCard label="Orders" value={overview.totalOrders} icon={ShoppingCart} />
              <StatCard label="Revenue" value={`$${overview.totalRevenue.toLocaleString()}`} icon={DollarSign} />
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Last 30 Days</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <MiniCard label="New Tenants" value={stats.recentActivity.newTenantsLast30Days} />
                    <MiniCard label="Orders" value={stats.recentActivity.ordersLast30Days} />
                    <MiniCard label="Revenue" value={`$${stats.recentActivity.revenueLast30Days.toLocaleString()}`} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Plans Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.plans.length > 0 ? (
                    <div className="space-y-3">
                      {stats.plans.map((plan) => (
                        <div key={plan.plan} className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-4 py-3">
                          <span className="font-medium capitalize">{plan.plan}</span>
                          <span className="text-sm text-muted-foreground">{plan.count} tenants</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-border bg-background/30 p-8 text-sm text-muted-foreground">
                      No plan data available.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function StatCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ElementType }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MiniCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/40 px-4 py-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}
