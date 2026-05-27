"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  WashOrder,
  Customer,
  Vehicle,
  Service,
  Location,
  PaginatedResponse,
} from "@/lib/types";
import {
  ClipboardList,
  Plus,
  X,
  AlertCircle,
  Trash2,
} from "lucide-react";

const statusVariants: Record<string, string> = {
  queued: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  washing: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  quality_check: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  ready_for_pickup: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  delivered: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
  cancelled: "bg-red-500/15 text-red-400 border-red-500/20",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<WashOrder[]>([]);
  const [meta, setMeta] = useState<PaginatedResponse<WashOrder>["meta"] | null>(
    null
  );
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const [form, setForm] = useState({
    locationId: "",
    customerId: "",
    vehicleId: "",
    items: [] as { serviceId: string; quantity: number }[],
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch<PaginatedResponse<WashOrder>>(
          `/wash-orders?page=${page}&limit=10`
        );
        if (!cancelled) {
          setOrders(res.data);
          setMeta(res.meta);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load orders");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [page]);

  useEffect(() => {
    if (!showForm) return;
    let cancelled = false;
    async function loadRefs() {
      try {
        const [cRes, lRes, sRes] = await Promise.all([
          apiFetch<{ data: Customer[] }>("/customers?page=1&limit=100"),
          apiFetch<{ data: Location[] }>("/locations"),
          apiFetch<{ data: Service[] }>("/services"),
        ]);
        if (!cancelled) {
          setCustomers(cRes.data);
          setLocations(lRes.data);
          setServices(sRes.data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load references"
          );
        }
      }
    }
    loadRefs();
    return () => {
      cancelled = true;
    };
  }, [showForm]);

  useEffect(() => {
    if (!form.customerId) {
      return;
    }
    let cancelled = false;
    async function loadVehicles() {
      try {
        const res = await apiFetch<{ data: Vehicle[] }>(
          `/vehicles/customer/${form.customerId}`
        );
        if (!cancelled) setVehicles(res.data);
      } catch {
        if (!cancelled) setVehicles([]);
      }
    }
    loadVehicles();
    return () => {
      cancelled = true;
    };
  }, [form.customerId]);

  function addItem() {
    setForm((f) => ({
      ...f,
      items: [...f.items, { serviceId: "", quantity: 1 }],
    }));
  }

  function updateItem(index: number, patch: Partial<{ serviceId: string; quantity: number }>) {
    setForm((f) => ({
      ...f,
      items: f.items.map((it, i) => (i === index ? { ...it, ...patch } : it)),
    }));
  }

  function removeItem(index: number) {
    setForm((f) => ({
      ...f,
      items: f.items.filter((_, i) => i !== index),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiFetch("/wash-orders", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setShowForm(false);
      setForm({ locationId: "", customerId: "", vehicleId: "", items: [], notes: "" });
      setPage(1);
      const res = await apiFetch<PaginatedResponse<WashOrder>>(
        `/wash-orders?page=1&limit=10`
      );
      setOrders(res.data);
      setMeta(res.meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create order");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Order
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {showForm && (
        <Card className="bg-card/60 border-border/60">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">New Order</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowForm(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="loc">Location</Label>
                  <select
                    id="loc"
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={form.locationId}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, locationId: e.target.value }))
                    }
                    required
                  >
                    <option value="">Select location</option>
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cust">Customer</Label>
                  <select
                    id="cust"
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={form.customerId}
                    onChange={(e) => {
                      setForm((f) => ({
                        ...f,
                        customerId: e.target.value,
                        vehicleId: "",
                      }));
                      setVehicles([]);
                    }}
                    required
                  >
                    <option value="">Select customer</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="veh">Vehicle</Label>
                  <select
                    id="veh"
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={form.vehicleId}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, vehicleId: e.target.value }))
                    }
                    required
                  >
                    <option value="">Select vehicle</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.plateNumber} - {v.make} {v.model}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Services</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addItem}>
                    Add Service
                  </Button>
                </div>
                <div className="space-y-2">
                  {form.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <select
                        className="flex h-10 flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        value={item.serviceId}
                        onChange={(e) =>
                          updateItem(idx, { serviceId: e.target.value })
                        }
                        required
                      >
                        <option value="">Select service</option>
                        {services.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} - ${Number(s.basePrice).toFixed(2)}
                          </option>
                        ))}
                      </select>
                      <Input
                        type="number"
                        min={1}
                        className="w-24"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(idx, {
                            quantity: Number(e.target.value) || 1,
                          })
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => removeItem(idx)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {form.items.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No services added yet.
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  placeholder="Optional notes"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Creating..." : "Create Order"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                ID
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Customer
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Status
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Payment
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Total
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-4 py-3">
                    <Skeleton className="h-4 w-16" />
                  </td>
                  <td className="px-4 py-3">
                    <Skeleton className="h-4 w-20" />
                  </td>
                  <td className="px-4 py-3">
                    <Skeleton className="h-4 w-24" />
                  </td>
                  <td className="px-4 py-3">
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </td>
                  <td className="px-4 py-3">
                    <Skeleton className="h-4 w-16" />
                  </td>
                  <td className="px-4 py-3">
                    <Skeleton className="h-4 w-24" />
                  </td>
                </tr>
              ))
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <ClipboardList className="h-8 w-8 opacity-40" />
                    <p>No orders found</p>
                  </div>
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    #{o.id.slice(-6)}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {o.customer?.name || o.customerId.slice(0, 8)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="outline"
                      className={statusVariants[o.status] || ""}
                    >
                      {o.status.replace(/_/g, " ")}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary">
                      {o.paymentStatus || "pending"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-semibold">
                    ${Number(o.finalAmount ?? o.totalAmount).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(o.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {meta.page} of {meta.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
