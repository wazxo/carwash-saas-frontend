"use client";

import { useEffect, useMemo, useState } from "react";
import { apiDownload, apiFetch } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import type { Location } from "@/lib/types";
import { BarChart3, Download, DollarSign, TrendingUp, Users } from "lucide-react";

type SalesReport = {
  totalOrders: number;
  totalRevenue: number;
  totalTips: number;
  byPaymentMethod: Array<{
    method: string;
    _sum: { amount: number | null };
    _count: number;
  }>;
  byStatus: Array<{
    status: string;
    _count: { [key: string]: number } | number;
  }>;
};

type StaffReportRow = {
  employeeId: string;
  orders: number;
  revenue: number;
};

type PopularServiceRow = {
  serviceId: string;
  _sum: { quantity: number | null; totalPrice: number | null };
  _count: number;
};

export default function ReportsPage() {
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const todayString = today.toISOString().slice(0, 10);

  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [from, setFrom] = useState(monthStart);
  const [to, setTo] = useState(todayString);
  const [locationId, setLocationId] = useState("");
  const [sales, setSales] = useState<SalesReport | null>(null);
  const [staff, setStaff] = useState<StaffReportRow[]>([]);
  const [popularServices, setPopularServices] = useState<PopularServiceRow[]>([]);

  async function downloadWorkbook() {
    const params = new URLSearchParams({ from, to });
    if (locationId) params.set("locationId", locationId);
    try {
      await apiDownload(
        `/reports/operations.xlsx?${params.toString()}`,
        `operational-report-${from}-to-${to}.xlsx`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to download workbook");
    }
  }

  async function loadReports(nextFrom = from, nextTo = to, nextLocationId = locationId) {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ from: nextFrom, to: nextTo });
      if (nextLocationId) params.set("locationId", nextLocationId);

      const [locationsRes, salesRes, staffRes, servicesRes] = await Promise.all([
        apiFetch<{ data: Location[] }>("/locations"),
        apiFetch<{ data: SalesReport }>(`/dashboard/sales?${params.toString()}`),
        apiFetch<{ data: StaffReportRow[] }>(`/dashboard/staff-performance?${params.toString()}`),
        apiFetch<{ data: PopularServiceRow[] }>(`/dashboard/popular-services?from=${nextFrom}&to=${nextTo}`),
      ]);

      setLocations(locationsRes.data);
      setSales(salesRes.data);
      setStaff(staffRes.data);
      setPopularServices(servicesRes.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadInitialReports() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ from: monthStart, to: todayString });
        const [locationsRes, salesRes, staffRes, servicesRes] = await Promise.all([
          apiFetch<{ data: Location[] }>("/locations"),
          apiFetch<{ data: SalesReport }>(`/dashboard/sales?${params.toString()}`),
          apiFetch<{ data: StaffReportRow[] }>(`/dashboard/staff-performance?${params.toString()}`),
          apiFetch<{ data: PopularServiceRow[] }>(`/dashboard/popular-services?from=${monthStart}&to=${todayString}`),
        ]);

        if (!cancelled) {
          setLocations(locationsRes.data);
          setSales(salesRes.data);
          setStaff(staffRes.data);
          setPopularServices(servicesRes.data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load reports");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadInitialReports();

    return () => {
      cancelled = true;
    };
  }, [monthStart, todayString]);

  const paymentRows = useMemo(
    () =>
      (sales?.byPaymentMethod || []).map((row) => ({
        method: row.method,
        transactions: row._count,
        revenue: Number(row._sum.amount || 0).toFixed(2),
      })),
    [sales]
  );

  const statusRows = useMemo(
    () =>
      (sales?.byStatus || []).map((row) => ({
        status: row.status,
        count: typeof row._count === "number" ? row._count : Object.values(row._count)[0],
      })),
    [sales]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
            <p className="text-sm text-muted-foreground">
              Review revenue, operational throughput, and export the current report view to CSV.
              Review revenue, throughput, and download a branded Excel workbook for operational reporting.
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={() => loadReports()}>
          Refresh
        </Button>
      </div>

      <div className="flex justify-end">
        <Button onClick={downloadWorkbook} className="gap-2">
          <Download className="h-4 w-4" />
          Download Excel Workbook
        </Button>
      </div>

      <Card>
        <CardContent className="grid gap-4 p-6 md:grid-cols-4">
          <div className="space-y-2">
            <Label>From</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>To</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Location</Label>
            <select
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
            >
              <option value="">All locations</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Button className="w-full" onClick={() => loadReports(from, to, locationId)}>
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-xl" />
          ))
        ) : (
          <>
            <MetricCard label="Total Revenue" value={`$${Number(sales?.totalRevenue || 0).toLocaleString()}`} icon={DollarSign} />
            <MetricCard label="Orders" value={sales?.totalOrders || 0} icon={BarChart3} />
            <MetricCard label="Tips" value={`$${Number(sales?.totalTips || 0).toLocaleString()}`} icon={TrendingUp} />
            <MetricCard label="Staff Rows" value={staff.length} icon={Users} />
          </>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="bg-card/50">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Workbook Output</p>
            <p className="mt-1 text-lg font-semibold">Excel .xlsx only</p>
            <p className="mt-2 text-sm text-muted-foreground">Branded workbook with summary, orders, payments, and services sheets.</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Branding</p>
            <p className="mt-1 text-lg font-semibold">Tenant logo + RNC</p>
            <p className="mt-2 text-sm text-muted-foreground">The workbook uses the tenant branding configured in settings.</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Accounting Focus</p>
            <p className="mt-1 text-lg font-semibold">Subtotal + tax + surcharge</p>
            <p className="mt-2 text-sm text-muted-foreground">Operational exports are structured for review, billing, and accounting handoff.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-56 rounded-xl" />
            ) : paymentRows.length === 0 ? (
              <EmptyState text="No payment data for this range." />
            ) : (
              <div className="space-y-3">
                {paymentRows.map((row) => (
                  <div key={row.method} className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-4 py-3">
                    <div>
                      <p className="font-medium capitalize">{row.method}</p>
                      <p className="text-sm text-muted-foreground">{row.transactions} transactions</p>
                    </div>
                    <p className="font-semibold">${row.revenue}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Order Statuses</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-56 rounded-xl" />
            ) : statusRows.length === 0 ? (
              <EmptyState text="No order status data for this range." />
            ) : (
              <div className="space-y-3">
                {statusRows.map((row) => (
                  <div key={row.status} className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-4 py-3">
                    <p className="font-medium capitalize">{row.status.replace(/_/g, " ")}</p>
                    <p className="font-semibold">{row.count}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Staff Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 rounded-xl" />
            ) : staff.length === 0 ? (
              <EmptyState text="No delivered orders assigned in this range." />
            ) : (
              <div className="space-y-3">
                {staff.map((row) => (
                  <div key={row.employeeId} className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-4 py-3">
                    <div>
                      <p className="font-medium">Employee {row.employeeId.slice(0, 8)}</p>
                      <p className="text-sm text-muted-foreground">{row.orders} completed orders</p>
                    </div>
                    <p className="font-semibold">${Number(row.revenue).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Popular Services</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 rounded-xl" />
            ) : popularServices.length === 0 ? (
              <EmptyState text="No service activity for this range." />
            ) : (
              <div className="space-y-3">
                {popularServices.map((row) => (
                  <div key={row.serviceId} className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-4 py-3">
                    <div>
                      <p className="font-medium">Service {row.serviceId.slice(0, 8)}</p>
                      <p className="text-sm text-muted-foreground">
                        Qty {row._sum.quantity || 0} • rows {row._count}
                      </p>
                    </div>
                    <p className="font-semibold">${Number(row._sum.totalPrice || 0).toFixed(2)}</p>
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

function MetricCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ElementType }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-background/30 p-8 text-sm text-muted-foreground">
      {text}
    </div>
  );
}
