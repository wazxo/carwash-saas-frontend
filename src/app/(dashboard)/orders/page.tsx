"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { WashOrder, Customer, Vehicle, Service, Location, PaginatedResponse } from "@/lib/types";
import { ClipboardList, Pencil, Plus, X, AlertCircle, Trash2 } from "lucide-react";

const statusVariants: Record<string, string> = {
  queued: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  washing: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  quality_check: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  ready_for_pickup: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  delivered: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
  cancelled: "bg-red-500/15 text-red-400 border-red-500/20",
};

const paymentVariants: Record<string, string> = {
  pending: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
  partial: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  paid: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  refunded: "bg-red-500/15 text-red-400 border-red-500/20",
};

type OrderItemDraft = { serviceId: string; quantity: number };

export default function OrdersPage() {
  const [orders, setOrders] = useState<WashOrder[]>([]);
  const [meta, setMeta] = useState<PaginatedResponse<WashOrder>["meta"] | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState<WashOrder | null>(null);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const [form, setForm] = useState({
    locationId: "",
    customerId: "",
    vehicleId: "",
    items: [] as OrderItemDraft[],
    taxAmount: "0",
    discountAmount: "0",
    surchargeAmount: "0",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  async function reloadOrders(targetPage = page) {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<PaginatedResponse<WashOrder>>(`/wash-orders?page=${targetPage}&limit=10`);
      setOrders(res.data);
      setMeta(res.meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await apiFetch<PaginatedResponse<WashOrder>>(`/wash-orders?page=${page}&limit=10`);
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
    void load();
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
          setError(err instanceof Error ? err.message : "Failed to load references");
        }
      }
    }
    void loadRefs();
    return () => {
      cancelled = true;
    };
  }, [showForm]);

  useEffect(() => {
    if (!form.customerId) return;
    let cancelled = false;
    async function loadVehicles() {
      try {
        const res = await apiFetch<{ data: Vehicle[] }>(`/vehicles/customer/${form.customerId}`);
        if (!cancelled) setVehicles(res.data);
      } catch {
        if (!cancelled) setVehicles([]);
      }
    }
    void loadVehicles();
    return () => {
      cancelled = true;
    };
  }, [form.customerId]);

  function addItem() {
    setForm((current) => ({
      ...current,
      items: [...current.items, { serviceId: "", quantity: 1 }],
    }));
  }

  function updateItem(index: number, patch: Partial<OrderItemDraft>) {
    setForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item
      ),
    }));
  }

  function removeItem(index: number) {
    setForm((current) => ({
      ...current,
      items: current.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  function resetForm() {
    setEditingOrder(null);
    setShowForm(false);
    setVehicles([]);
    setForm({
      locationId: "",
      customerId: "",
      vehicleId: "",
      items: [],
      taxAmount: "0",
      discountAmount: "0",
      surchargeAmount: "0",
      notes: "",
    });
  }

  function openCreate() {
    resetForm();
    setShowForm(true);
  }

  function openEdit(order: WashOrder) {
    setEditingOrder(order);
    setVehicles([]);
    setShowForm(true);
    setForm({
      locationId: order.locationId,
      customerId: order.customerId,
      vehicleId: order.vehicleId,
      items: order.items.map((item) => ({ serviceId: item.serviceId, quantity: item.quantity })),
      taxAmount: String(order.taxAmount ?? 0),
      discountAmount: String(order.discountAmount ?? 0),
      surchargeAmount: String(order.surchargeAmount ?? 0),
      notes: order.notes || "",
    });
  }

  const draftSubtotal = form.items.reduce((sum, item) => {
    const service = services.find((entry) => entry.id === item.serviceId);
    if (!service) return sum;
    return sum + Number(service.basePrice) * item.quantity;
  }, 0);
  const draftTotal = Math.max(
    0,
    draftSubtotal + Number(form.taxAmount || 0) + Number(form.surchargeAmount || 0) - Number(form.discountAmount || 0)
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiFetch(editingOrder ? `/wash-orders/${editingOrder.id}` : "/wash-orders", {
        method: editingOrder ? "PATCH" : "POST",
        body: JSON.stringify({
          locationId: form.locationId,
          customerId: form.customerId,
          vehicleId: form.vehicleId,
          items: form.items,
          taxAmount: Number(form.taxAmount || 0),
          discountAmount: Number(form.discountAmount || 0),
          surchargeAmount: Number(form.surchargeAmount || 0),
          notes: form.notes,
        }),
      });
      resetForm();
      setPage(1);
      await reloadOrders(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save order");
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
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          New Order
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <Card className="bg-card/50"><CardContent className="p-5"><p className="text-sm text-muted-foreground">Open Orders</p><p className="mt-1 text-2xl font-bold">{orders.filter((order) => !["delivered", "cancelled"].includes(order.status)).length}</p></CardContent></Card>
        <Card className="bg-card/50"><CardContent className="p-5"><p className="text-sm text-muted-foreground">Paid Orders</p><p className="mt-1 text-2xl font-bold">{orders.filter((order) => order.paymentStatus === "paid").length}</p></CardContent></Card>
        <Card className="bg-card/50"><CardContent className="p-5"><p className="text-sm text-muted-foreground">Pending Collection</p><p className="mt-1 text-2xl font-bold">{orders.filter((order) => order.paymentStatus !== "paid" && order.status !== "cancelled").length}</p></CardContent></Card>
        <Card className="bg-card/50"><CardContent className="p-5"><p className="text-sm text-muted-foreground">Visible Revenue</p><p className="mt-1 text-2xl font-bold">${orders.reduce((sum, order) => sum + Number(order.finalAmount ?? order.totalAmount), 0).toFixed(2)}</p></CardContent></Card>
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
              <CardTitle className="text-base">
                {editingOrder ? `Edit Order #${editingOrder.id.slice(-6)}` : "New Order"}
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={resetForm}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="loc">Location</Label>
                  <select id="loc" className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" value={form.locationId} onChange={(e) => setForm((f) => ({ ...f, locationId: e.target.value }))} required>
                    <option value="">Select location</option>
                    {locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cust">Customer</Label>
                  <select id="cust" className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" value={form.customerId} onChange={(e) => { setForm((f) => ({ ...f, customerId: e.target.value, vehicleId: "" })); setVehicles([]); }} required>
                    <option value="">Select customer</option>
                    {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="veh">Vehicle</Label>
                  <select id="veh" className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" value={form.vehicleId} onChange={(e) => setForm((f) => ({ ...f, vehicleId: e.target.value }))} required>
                    <option value="">Select vehicle</option>
                    {vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.plateNumber} - {vehicle.make} {vehicle.model}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Services</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addItem}>Add Service</Button>
                </div>
                <div className="space-y-2">
                  {form.items.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <select className="flex h-10 flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm" value={item.serviceId} onChange={(e) => updateItem(index, { serviceId: e.target.value })} required>
                        <option value="">Select service</option>
                        {services.map((service) => <option key={service.id} value={service.id}>{service.name} - ${Number(service.basePrice).toFixed(2)}</option>)}
                      </select>
                      <Input type="number" min={1} className="w-24" value={item.quantity} onChange={(e) => updateItem(index, { quantity: Number(e.target.value) || 1 })} />
                      <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => removeItem(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {form.items.length === 0 && <p className="text-sm text-muted-foreground">No services added yet.</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input id="notes" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Optional notes" />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2"><Label htmlFor="taxAmount">ITBIS</Label><Input id="taxAmount" type="number" step="0.01" value={form.taxAmount} onChange={(e) => setForm((f) => ({ ...f, taxAmount: e.target.value }))} /></div>
                <div className="space-y-2"><Label htmlFor="discountAmount">Discount</Label><Input id="discountAmount" type="number" step="0.01" value={form.discountAmount} onChange={(e) => setForm((f) => ({ ...f, discountAmount: e.target.value }))} /></div>
                <div className="space-y-2"><Label htmlFor="surchargeAmount">Surcharge</Label><Input id="surchargeAmount" type="number" step="0.01" value={form.surchargeAmount} onChange={(e) => setForm((f) => ({ ...f, surchargeAmount: e.target.value }))} /></div>
              </div>

              <div className="rounded-xl border border-border/60 bg-background/40 p-3 text-sm">
                <div className="flex items-center justify-between text-muted-foreground"><span>Subtotal</span><span>${draftSubtotal.toFixed(2)}</span></div>
                <div className="mt-1 flex items-center justify-between text-muted-foreground"><span>Draft total</span><span>${draftTotal.toFixed(2)}</span></div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                <Button type="submit" disabled={submitting}>{submitting ? "Saving..." : editingOrder ? "Save Changes" : "Create Order"}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">ID</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Customer</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Payment</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Total</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-5 w-20 rounded-full" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-5 w-20 rounded-full" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                </tr>
              ))
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <ClipboardList className="h-8 w-8 opacity-40" />
                    <p>No orders found</p>
                  </div>
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">#{order.id.slice(-6)}</td>
                  <td className="px-4 py-3 font-medium">{order.customer?.name || order.customerId.slice(0, 8)}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={statusVariants[order.status] || ""}>
                      {order.status.replace(/_/g, " ")}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={paymentVariants[order.paymentStatus || "pending"] || ""}>
                      {order.paymentStatus || "pending"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-semibold">${Number(order.finalAmount ?? order.totalAmount).toFixed(2)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(order.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={order.paymentStatus === "paid" || order.status === "delivered" || order.status === "cancelled"}
                      onClick={() => openEdit(order)}
                    >
                      <Pencil className="mr-1 h-4 w-4" />
                      Edit
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Page {meta.page} of {meta.totalPages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage((current) => current + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
