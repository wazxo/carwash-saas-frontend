"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { fiscalDocumentTypeHelp, validateDominicanTaxId } from "@/lib/fiscal";
import type { WashOrder, Payment } from "@/lib/types";
import {
  CreditCard,
  DollarSign,
  AlertCircle,
  Receipt,
  TrendingUp,
} from "lucide-react";

export default function PaymentsPage() {
  const [orders, setOrders] = useState<WashOrder[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    orderId: "",
    amount: "",
    method: "cash",
    tipAmount: "",
    fiscalDocumentType: "B02",
    customerLegalName: "",
    customerTaxId: "",
    customerEmail: "",
    customerPhone: "",
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [oRes, pRes] = await Promise.all([
          apiFetch<{ data: WashOrder[] }>("/wash-orders?page=1&limit=100"),
          apiFetch<{ data: Payment[] }>('/payments?page=1&limit=20'),
        ]);
        if (!cancelled) {
          setOrders(oRes.data);
          setPayments(pRes.data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load data");
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

  const unpaidOrders = orders.filter((order) => {
    if (order.status === "cancelled") return false;
    const totalPaid = (order.payments ?? []).reduce(
      (sum, payment) => sum + Number(payment.amount),
      0
    );
    return totalPaid + 0.01 < Number(order.finalAmount ?? order.totalAmount);
  });

  const selectedOrder = orders.find((order) => order.id === form.orderId);
  const selectedOrderPaid = (selectedOrder?.payments ?? []).reduce(
    (sum, payment) => sum + Number(payment.amount),
    0
  );
  const selectedOrderRemaining = selectedOrder
    ? Math.max(
        0,
        Number(selectedOrder.finalAmount ?? selectedOrder.totalAmount) -
          selectedOrderPaid
      )
    : 0;
  const taxIdValidation = validateDominicanTaxId(form.customerTaxId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedOrder || selectedOrderRemaining <= 0) {
      setError("This order is already fully paid.");
      return;
    }
    if (form.customerTaxId && !taxIdValidation.valid) {
      setError("Customer tax ID must be a valid Dominican RNC or cédula.");
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch("/payments", {
        method: "POST",
        body: JSON.stringify({
          orderId: form.orderId,
          amount: Number(form.amount),
          method: form.method,
          tipAmount: Number(form.tipAmount || 0),
          fiscalDocumentType: form.fiscalDocumentType,
          customerLegalName: form.customerLegalName || undefined,
          customerTaxId: form.customerTaxId || undefined,
          customerEmail: form.customerEmail || undefined,
          customerPhone: form.customerPhone || undefined,
        }),
      });
      setForm({ orderId: "", amount: "", method: "cash", tipAmount: "", fiscalDocumentType: "B02", customerLegalName: "", customerTaxId: "", customerEmail: "", customerPhone: "" });
      const [oRes, pRes] = await Promise.all([
        apiFetch<{ data: WashOrder[] }>("/wash-orders?page=1&limit=100"),
        apiFetch<{ data: Payment[] }>("/payments?page=1&limit=20"),
      ]);
      setOrders(oRes.data);
      setPayments(pRes.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to register payment"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <CreditCard className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-semibold tracking-tight">Payments</h1>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1 bg-card/60 border-border/60">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-400" />
              <CardTitle className="text-base">Register Payment</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="orderId">Order</Label>
                <select
                  id="orderId"
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={form.orderId}
                  onChange={(e) => {
                    const nextOrder = orders.find((order) => order.id === e.target.value);
                    const nextPaid = (nextOrder?.payments ?? []).reduce(
                      (sum, payment) => sum + Number(payment.amount),
                      0
                    );
                    const nextRemaining = nextOrder
                      ? Math.max(0, Number(nextOrder.finalAmount ?? nextOrder.totalAmount) - nextPaid)
                      : 0;

                    setForm((f) => ({
                      ...f,
                      orderId: e.target.value,
                      amount: nextRemaining > 0 ? nextRemaining.toFixed(2) : "",
                      customerLegalName: nextOrder?.customer?.name || "",
                      customerTaxId: "",
                      customerEmail: "",
                      customerPhone: nextOrder?.customer?.phone || "",
                    }));
                  }}
                  required
                >
                  <option value="">Select order</option>
                  {unpaidOrders.map((o) => (
                    <option key={o.id} value={o.id}>
                      #{o.id.slice(-6)} - {o.customer?.name || o.vehicle?.plateNumber || "Order"}
                    </option>
                  ))}
                </select>
                {selectedOrder && (
                  <div className="rounded-lg border border-border/60 bg-background/60 p-3 text-xs text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span>Total</span>
                      <span>${Number(selectedOrder.finalAmount ?? selectedOrder.totalAmount).toFixed(2)}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <span>Paid</span>
                      <span>${selectedOrderPaid.toFixed(2)}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between font-medium text-foreground">
                      <span>Remaining</span>
                      <span>${selectedOrderRemaining.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="fiscalType">Fiscal Document Type</Label>
                <select
                  id="fiscalType"
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  value={form.fiscalDocumentType}
                  onChange={(e) => setForm((f) => ({ ...f, fiscalDocumentType: e.target.value }))}
                >
                  <option value="B02">B02 - Consumo</option>
                  <option value="B01">B01 - Credito fiscal</option>
                  <option value="B14">B14 - Regimen especial</option>
                  <option value="B15">B15 - Gubernamental</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  {fiscalDocumentTypeHelp[form.fiscalDocumentType]?.description}
                </p>
              </div>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerLegalName">Customer Legal Name</Label>
                  <Input id="customerLegalName" value={form.customerLegalName} onChange={(e) => setForm((f) => ({ ...f, customerLegalName: e.target.value }))} placeholder={selectedOrder?.customer?.name || "Cliente / razón social"} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerTaxId">Customer Tax ID</Label>
                  <Input id="customerTaxId" value={form.customerTaxId} onChange={(e) => setForm((f) => ({ ...f, customerTaxId: e.target.value }))} placeholder="RNC o cédula" />
                  {form.customerTaxId ? (
                    <p className={`text-xs ${taxIdValidation.valid ? "text-emerald-400" : "text-destructive"}`}>
                      {taxIdValidation.valid
                        ? `${taxIdValidation.type} válido`
                        : "RNC o cédula inválido"}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, amount: e.target.value }))
                  }
                  max={selectedOrderRemaining || undefined}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="method">Method</Label>
                <select
                  id="method"
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={form.method}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, method: e.target.value }))
                  }
                  required
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="transfer">Transfer</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tip">Tip ($)</Label>
                <Input
                  id="tip"
                  type="number"
                  step="0.01"
                  value={form.tipAmount}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, tipAmount: e.target.value }))
                  }
                  placeholder="0.00"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="customerEmail">Customer Email</Label>
                  <Input id="customerEmail" value={form.customerEmail} onChange={(e) => setForm((f) => ({ ...f, customerEmail: e.target.value }))} placeholder={selectedOrder?.customer?.phone ? "Opcional" : "Email opcional"} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerPhone">Customer Phone</Label>
                  <Input id="customerPhone" value={form.customerPhone} onChange={(e) => setForm((f) => ({ ...f, customerPhone: e.target.value }))} placeholder={selectedOrder?.customer?.phone || "Teléfono opcional"} />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Processing..." : selectedOrderRemaining <= 0 && selectedOrder ? "Already Paid" : "Register Payment"}
              </Button>
              {selectedOrder?.paymentStatus ? (
                <p className="text-xs text-muted-foreground text-center">
                  Current payment status: <span className="font-medium capitalize">{selectedOrder.paymentStatus}</span>
                </p>
              ) : null}
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 bg-card/60 border-border/60">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Recent Payments</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 rounded-lg" />
                ))}
              </div>
            ) : payments.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-background/30 py-12 text-center">
                <CreditCard className="h-10 w-10 text-muted-foreground/40" />
                <p className="mt-3 text-sm text-muted-foreground">
                  No payments yet
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {payments.map((p) => (
                  <div
                    key={p.id}
                    className="flex flex-col gap-2 rounded-lg border border-border/60 bg-background/50 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10">
                        <TrendingUp className="h-4 w-4 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          Order #{p.orderId.slice(-6)}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {p.method}
                          {p.order ? ` • ${p.order.status}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {p.tipAmount ? (
                        <Badge variant="secondary">
                          Tip ${Number(p.tipAmount).toFixed(2)}
                        </Badge>
                      ) : null}
                      <span className="text-sm font-semibold">
                        ${Number(p.amount).toFixed(2)}
                      </span>
                      <Badge
                        variant="outline"
                        className={
                          p.status === "completed"
                            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
                            : "bg-amber-500/15 text-amber-400 border-amber-500/20"
                        }
                      >
                        {p.status}
                      </Badge>
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
