"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type { DashboardOverview, WashOrder } from "@/lib/types";
import {
  DollarSign,
  Users,
  ClipboardList,
  Car,
  TrendingUp,
  Clock,
} from "lucide-react";

const statusColor: Record<string, string> = {
  queued: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  washing: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  quality_check: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  ready_for_pickup: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  delivered: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
  cancelled: "bg-red-500/15 text-red-400 border-red-500/20",
};

export default function DashboardPage() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [recentOrders, setRecentOrders] = useState<WashOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [overviewRes, ordersRes] = await Promise.all([
          apiFetch<{ data: DashboardOverview }>("/dashboard/overview"),
          apiFetch<{ data: WashOrder[] }>("/wash-orders?page=1&limit=5"),
        ]);
        if (!cancelled) {
          setOverview(overviewRes.data);
          setRecentOrders(ordersRes.data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load overview");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = [
    {
      label: "Orders Today",
      value: overview?.ordersToday ?? 0,
      icon: ClipboardList,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      label: "Revenue Today",
      value: overview?.revenueToday ?? 0,
      prefix: "$",
      icon: DollarSign,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Active Orders",
      value: overview?.activeOrders ?? 0,
      icon: Car,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      label: "Customers Today",
      value: overview?.customersToday ?? 0,
      icon: Users,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="bg-card/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  {loading ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    <p className="text-2xl font-bold">
                      {s.prefix}
                      {typeof s.value === "number"
                        ? s.value.toLocaleString()
                        : s.value}
                    </p>
                  )}
                </div>
                <div className={`rounded-lg ${s.bg} p-3`}>
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 bg-card/50">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <CardTitle>Recent Activity</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex flex-col gap-3 rounded-lg border border-border/60 bg-background/50 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
                      <Car className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {order.customer?.name || `Order #${order.id.slice(-6)}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {order.vehicle?.plateNumber || "Vehicle pending"} • {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className={statusColor[order.status] || ""}
                    >
                      {order.status.replace(/_/g, " ")}
                    </Badge>
                    <span className="text-sm font-semibold">
                      ${Number(order.finalAmount ?? order.totalAmount).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
              {!loading && recentOrders.length === 0 && (
                <div className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
                  No recent orders yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardHeader className="pb-4">
            <CardTitle>Quick Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                Use the Queue page to manage active wash orders.
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                Register payments from the Payments page.
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                Add new customers and vehicles before creating orders.
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                Print receipts from the Receipts page by order ID.
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
