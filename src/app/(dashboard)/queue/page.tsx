"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type { WashOrder, Location, Employee } from "@/lib/types";
import {
  Clock,
  Car,
  AlertCircle,
  RefreshCw,
  MapPin,
  User,
  CheckCircle2,
  XCircle,
  ArrowRight,
} from "lucide-react";

const columns = [
  { key: "queued", label: "Queued", color: "border-blue-500/30" },
  { key: "washing", label: "Washing", color: "border-amber-500/30" },
  { key: "quality_check", label: "Quality Check", color: "border-purple-500/30" },
  { key: "ready_for_pickup", label: "Ready", color: "border-emerald-500/30" },
] as const;

const statusLabel: Record<string, string> = {
  queued: "Queued",
  washing: "Washing",
  quality_check: "Quality Check",
  ready_for_pickup: "Ready",
};

const statusBadge: Record<string, string> = {
  queued: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  washing: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  quality_check: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  ready_for_pickup: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
};

export default function QueuePage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [orders, setOrders] = useState<WashOrder[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      try {
        const [locRes, empRes] = await Promise.all([
          apiFetch<{ data: Location[] }>("/locations"),
          apiFetch<{ data: Employee[] }>("/employees?limit=100"),
        ]);
        if (!cancelled) {
          setLocations(locRes.data);
          setEmployees(empRes.data);
          if (locRes.data.length > 0) {
            setSelectedLocation(locRes.data[0].id);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load data");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedLocation) return;
    let cancelled = false;
    async function loadQueue() {
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch<{ data: WashOrder[] }>(
          `/wash-orders/queue/${selectedLocation}`
        );
        if (!cancelled) setOrders(res.data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load queue");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadQueue();
    return () => {
      cancelled = true;
    };
  }, [selectedLocation]);

  async function updateStatus(orderId: string, status: string, assignedEmployeeId?: string) {
    setUpdatingId(orderId);
    try {
      await apiFetch(`/wash-orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status, assignedEmployeeId }),
      });
      const res = await apiFetch<{ data: WashOrder[] }>(
        `/wash-orders/queue/${selectedLocation}`
      );
      setOrders(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  }

  async function assignEmployee(orderId: string, employeeId: string) {
    setUpdatingId(orderId);
    try {
      await apiFetch(`/wash-orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "washing", assignedEmployeeId: employeeId }),
      });
      const res = await apiFetch<{ data: WashOrder[] }>(
        `/wash-orders/queue/${selectedLocation}`
      );
      setOrders(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign");
    } finally {
      setUpdatingId(null);
    }
  }

  async function cancelOrder(orderId: string) {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    setUpdatingId(orderId);
    try {
      await apiFetch(`/wash-orders/${orderId}`, { method: "DELETE" });
      const res = await apiFetch<{ data: WashOrder[] }>(
        `/wash-orders/queue/${selectedLocation}`
      );
      setOrders(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel");
    } finally {
      setUpdatingId(null);
    }
  }

  const byStatus = (status: string) =>
    orders.filter((o) => o.status === status);

  const nextStatus = (current: string) => {
    const flow = ["queued", "washing", "quality_check", "ready_for_pickup"];
    const idx = flow.indexOf(current);
    return idx >= 0 && idx < flow.length - 1 ? flow[idx + 1] : null;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-semibold tracking-tight">Work Queue</h1>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <select
            className="h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
          >
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              if (!selectedLocation) return;
              setLoading(true);
              apiFetch<{ data: WashOrder[] }>(`/wash-orders/queue/${selectedLocation}`)
                .then((res) => setOrders(res.data))
                .catch((err) => setError(err.message))
                .finally(() => setLoading(false));
            }}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {loading && locations.length === 0 ? (
        <div className="grid gap-4 lg:grid-cols-4">
          {columns.map((c) => (
            <Skeleton key={c.key} className="h-96 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-4">
          {columns.map((col) => (
            <div key={col.key} className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  {col.label}
                </h2>
                <Badge variant="secondary">{byStatus(col.key).length}</Badge>
              </div>
              <div className="flex flex-col gap-3">
                {byStatus(col.key).map((order) => {
                  const vehicle = order.vehicle;
                  const customer = order.customer;
                  const nxt = nextStatus(order.status);
                  const isUpdating = updatingId === order.id;

                  return (
                    <Card
                      key={order.id}
                      className={`bg-card/60 border-border/60 transition-colors hover:border-primary/40 ${col.color}`}
                    >
                      <CardContent className="p-4 space-y-3">
                        {/* Header: status + order number */}
                        <div className="flex items-center justify-between">
                          <Badge
                            variant="outline"
                            className={statusBadge[order.status] || ""}
                          >
                            {statusLabel[order.status] || order.status}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            #{order.id.slice(-6).toUpperCase()}
                          </span>
                        </div>

                        {/* Vehicle + Customer */}
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <Car className="h-4 w-4 text-primary shrink-0" />
                            {vehicle ? (
                              <span>
                                {vehicle.plateNumber} — {vehicle.color} {vehicle.make} {vehicle.model}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">Unknown vehicle</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <User className="h-3.5 w-3.5 shrink-0" />
                            {customer ? (
                              <span>{customer.name}</span>
                            ) : (
                              <span>Unknown customer</span>
                            )}
                          </div>
                          {order.assignedEmployee?.user && (
                            <div className="flex items-center gap-2 text-xs text-primary/80">
                              <User className="h-3.5 w-3.5 shrink-0" />
                              <span>
                                Assigned: {order.assignedEmployee.user.firstName}{" "}
                                {order.assignedEmployee.user.lastName}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Services */}
                        <div className="flex flex-wrap gap-1.5">
                          {order.items.map((item) => (
                            <Badge
                              key={item.id}
                              variant="secondary"
                              className="text-[10px] font-normal"
                            >
                              {item.service?.name || item.serviceName || "Service"} ×
                              {item.quantity}
                            </Badge>
                          ))}
                        </div>

                        {/* Total + Actions */}
                        <div className="flex items-center justify-between pt-1 border-t border-border/50">
                          <span className="text-sm font-bold">
                            ${Number(order.totalAmount).toFixed(2)}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {order.status === "queued" && (
                              <select
                                className="h-7 rounded-md border border-input bg-background px-2 py-0 text-[10px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                value=""
                                disabled={isUpdating}
                                onChange={(e) => {
                                  if (e.target.value) {
                                    assignEmployee(order.id, e.target.value);
                                  }
                                }}
                              >
                                <option value="">Assign to...</option>
                                {employees.map((emp) => (
                                  <option key={emp.id} value={emp.id}>
                                    {emp.user?.firstName} {emp.user?.lastName}
                                  </option>
                                ))}
                              </select>
                            )}
                            {nxt && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 gap-1 text-xs px-2"
                                disabled={isUpdating}
                                onClick={() =>
                                  updateStatus(order.id, nxt)
                                }
                              >
                                {isUpdating ? (
                                  <RefreshCw className="h-3 w-3 animate-spin" />
                                ) : (
                                  <>
                                    {nxt === "ready_for_pickup"
                                      ? "Finish"
                                      : statusLabel[nxt]}
                                    <ArrowRight className="h-3 w-3" />
                                  </>
                                )}
                              </Button>
                            )}
                            {order.status === "ready_for_pickup" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 gap-1 text-xs px-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                                disabled={isUpdating}
                                onClick={() =>
                                  updateStatus(order.id, "delivered")
                                }
                              >
                                {isUpdating ? (
                                  <RefreshCw className="h-3 w-3 animate-spin" />
                                ) : (
                                  <>
                                    <CheckCircle2 className="h-3 w-3" />
                                    Deliver
                                  </>
                                )}
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                              disabled={isUpdating}
                              onClick={() => cancelOrder(order.id)}
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {byStatus(col.key).length === 0 && (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/30 py-10 text-center">
                    <Clock className="h-8 w-8 text-muted-foreground/40" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      No orders
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
