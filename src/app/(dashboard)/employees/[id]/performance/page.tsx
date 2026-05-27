"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { EmployeePerformance } from "@/lib/types";
import {
  ArrowLeft,
  ClipboardList,
  DollarSign,
  TrendingUp,
  UserCog,
  Wrench,
} from "lucide-react";

const statusTone: Record<string, string> = {
  queued: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  washing: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  quality_check: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  ready_for_pickup: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  delivered: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
  cancelled: "bg-red-500/15 text-red-400 border-red-500/20",
};

export default function EmployeePerformancePage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const employeeId = Array.isArray(params.id) ? params.id[0] : params.id;

  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const monthEnd = today.toISOString().slice(0, 10);

  const [from, setFrom] = useState(searchParams.get("from") || monthStart);
  const [to, setTo] = useState(searchParams.get("to") || monthEnd);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [performance, setPerformance] = useState<EmployeePerformance | null>(null);

  useEffect(() => {
    if (!employeeId) return;
    let cancelled = false;

    async function loadPerformance() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (from) params.set("from", from);
        if (to) params.set("to", to);
        const res = await apiFetch<{ data: EmployeePerformance }>(
          `/employees/${employeeId}/performance?${params.toString()}`
        );
        if (!cancelled) setPerformance(res.data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load employee performance"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadPerformance();

    return () => {
      cancelled = true;
    };
  }, [employeeId, from, to]);

  const summary = performance?.summary;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm">
            <Link href="/employees">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Employee Performance</h1>
            <p className="text-sm text-muted-foreground">
              {performance?.employee.name || "Loading employee..."}
            </p>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading || !summary
          ? Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-28 rounded-xl" />
            ))
          : [
              {
                label: "Orders Assigned",
                value: summary.totalOrdersAssigned,
                icon: ClipboardList,
                tone: "text-blue-400 bg-blue-500/10",
              },
              {
                label: "Completed Orders",
                value: summary.completedOrders,
                icon: TrendingUp,
                tone: "text-emerald-400 bg-emerald-500/10",
              },
              {
                label: "Services Done",
                value: summary.totalServicesDone,
                icon: Wrench,
                tone: "text-amber-400 bg-amber-500/10",
              },
              {
                label: "Assigned Revenue",
                value: `$${summary.totalRevenueAssigned.toLocaleString()}`,
                icon: DollarSign,
                tone: "text-purple-400 bg-purple-500/10",
              },
            ].map((card) => (
              <Card key={card.label} className="bg-card/50">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-muted-foreground">{card.label}</p>
                      <p className="mt-1 text-2xl font-semibold">{card.value}</p>
                    </div>
                    <div className={`rounded-lg p-3 ${card.tone}`}>
                      <card.icon className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="bg-card/60 border-border/60 xl:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserCog className="h-4 w-4 text-primary" />
              Employee Snapshot
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {loading || !performance ? (
              <Skeleton className="h-32 rounded-xl" />
            ) : (
              <>
                <div>
                  <p className="text-muted-foreground">Name</p>
                  <p className="font-medium">{performance.employee.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{performance.employee.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Job Title</p>
                  <p className="font-medium">{performance.employee.jobTitle || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Location</p>
                  <p className="font-medium">{performance.employee.location?.name || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Service Revenue</p>
                  <p className="font-medium">
                    ${performance.summary.totalRevenueFromServices.toLocaleString()}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/60 border-border/60 xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Service Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-56 rounded-xl" />
            ) : !performance || performance.serviceBreakdown.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-background/30 p-8 text-sm text-muted-foreground">
                No tracked service work for this period.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border/60">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Service</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Qty</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {performance.serviceBreakdown.map((row) => (
                      <tr key={row.service}>
                        <td className="px-4 py-3 font-medium">{row.service}</td>
                        <td className="px-4 py-3">{row.count}</td>
                        <td className="px-4 py-3">${row.revenue.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="bg-card/60 border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 rounded-xl" />
            ) : !performance || performance.recentOrders.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-background/30 p-8 text-sm text-muted-foreground">
                No assigned orders in this period.
              </div>
            ) : (
              <div className="space-y-3">
                {performance.recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between rounded-xl border border-border/60 bg-background/40 p-4"
                  >
                    <div>
                      <p className="text-sm font-medium">{order.customer}</p>
                      <p className="text-xs text-muted-foreground">
                        #{order.id.slice(-6)} • {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${statusTone[order.status] || ""}`}
                      >
                        {order.status.replace(/_/g, " ")}
                      </div>
                      <p className="mt-2 text-sm font-semibold">
                        ${order.totalAmount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/60 border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Recent Services</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 rounded-xl" />
            ) : !performance || performance.recentServices.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-background/30 p-8 text-sm text-muted-foreground">
                No completed service items in this period.
              </div>
            ) : (
              <div className="space-y-3">
                {performance.recentServices.map((item, index) => (
                  <div
                    key={`${item.orderId}-${item.service}-${index}`}
                    className="flex items-center justify-between rounded-xl border border-border/60 bg-background/40 p-4"
                  >
                    <div>
                      <p className="text-sm font-medium">{item.service}</p>
                      <p className="text-xs text-muted-foreground">
                        Order #{item.orderId.slice(-6)} • Qty {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <div
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${statusTone[item.orderStatus] || ""}`}
                      >
                        {item.orderStatus.replace(/_/g, " ")}
                      </div>
                      <p className="mt-2 text-sm font-semibold">
                        ${item.totalPrice.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
