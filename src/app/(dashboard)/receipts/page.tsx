"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { Receipt, WashOrder } from "@/lib/types";
import {
  Receipt as ReceiptIcon,
  Search,
  AlertCircle,
  CheckCircle2,
  Download,
} from "lucide-react";

export default function ReceiptsPage() {
  const [orderId, setOrderId] = useState("");
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [paidOrders, setPaidOrders] = useState<WashOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPaidOrders() {
      setOrdersLoading(true);
      try {
        const res = await apiFetch<{ data: WashOrder[] }>(
          "/wash-orders?page=1&limit=50"
        );
        if (!cancelled) {
          setPaidOrders(
            res.data.filter(
              (order) =>
                order.paymentStatus === "paid" && order.status !== "cancelled"
            )
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load paid orders"
          );
        }
      } finally {
        if (!cancelled) setOrdersLoading(false);
      }
    }

    void loadPaidOrders();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!orderId.trim()) return;
    setLoading(true);
    setError(null);
    setReceipt(null);
    try {
      const res = await apiFetch<{ data: Receipt[] }>(
        `/receipts/order/${orderId.trim()}`
      );
      const latestReceipt = res.data[0] ?? null;
      if (!latestReceipt) {
        setError("Receipt not found");
      } else {
        setReceipt(latestReceipt);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Receipt not found");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <ReceiptIcon className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-semibold tracking-tight">Receipts</h1>
      </div>

      <Card className="bg-card/60 border-border/60">
        <CardContent className="p-6">
          <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="space-y-2">
              <p className="text-sm font-medium">Paid Orders</p>
              {ordersLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <select
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                >
                  <option value="">Select a paid order</option>
                  {paidOrders.map((order) => (
                    <option key={order.id} value={order.id}>
                      #{order.id.slice(-6)} - {order.customer?.name || order.vehicle?.plateNumber || "Paid order"}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Quick Picks</p>
              <div className="flex flex-wrap gap-2">
                {paidOrders.slice(0, 4).map((order) => (
                  <Button
                    key={order.id}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="max-w-full gap-2"
                    onClick={() => setOrderId(order.id)}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="truncate">
                      #{order.id.slice(-6)} {order.customer?.name || order.vehicle?.plateNumber || "Order"}
                    </span>
                  </Button>
                ))}
                {!ordersLoading && paidOrders.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No paid orders with receipts yet.
                  </p>
                )}
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSearch}
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium">Order ID</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Paste or select an order ID"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Button type="submit" disabled={loading} className="gap-2">
              {loading ? "Searching..." : "View Receipt"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {!ordersLoading && paidOrders.length > 0 && !receipt && !loading && (
        <Card className="bg-card/40 border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recent Paid Orders</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {paidOrders.slice(0, 6).map((order) => (
              <button
                key={order.id}
                type="button"
                onClick={() => setOrderId(order.id)}
                className="flex w-full items-center justify-between rounded-lg border border-border/60 bg-background/50 px-4 py-3 text-left transition-colors hover:border-primary/40"
              >
                <div>
                  <p className="text-sm font-medium">
                    {order.customer?.name || "Paid order"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    #{order.id.slice(-6)}
                    {order.vehicle?.plateNumber
                      ? ` • ${order.vehicle.plateNumber}`
                      : ""}
                    {order.location?.name ? ` • ${order.location.name}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">
                    ${Number(order.finalAmount ?? order.totalAmount).toFixed(2)}
                  </p>
                  <p className="text-xs text-emerald-400">Paid</p>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {loading && (
        <Card className="bg-card/60 border-border/60">
          <CardContent className="p-8 space-y-4">
            <Skeleton className="mx-auto h-6 w-40" />
            <Skeleton className="mx-auto h-4 w-24" />
            <div className="space-y-2 pt-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </CardContent>
        </Card>
      )}

      {receipt && !loading && (
        <Card className="mx-auto max-w-md bg-card/80 border-border/60">
          <CardHeader className="text-center pb-2">
            <ReceiptIcon className="mx-auto h-8 w-8 text-primary" />
            <CardTitle className="text-lg font-bold tracking-tight mt-2">
              Receipt
            </CardTitle>
            <p className="text-xs text-muted-foreground font-mono">
              {receipt.receiptNumber}
            </p>
            {receipt.ncf ? (
              <p className="text-xs text-primary font-mono">NCF: {receipt.ncf}</p>
            ) : null}
            {receipt.fiscalDocumentType ? (
              <p className="text-xs text-muted-foreground">Tipo fiscal: {receipt.fiscalDocumentType}</p>
            ) : null}
          </CardHeader>
          <CardContent className="p-6 pt-2 space-y-4">
            <div className="grid gap-2 rounded-lg border border-border/60 bg-background/40 p-3 text-sm">
              <div>
                <p className="text-muted-foreground">Emisor</p>
                <p className="font-medium">{receipt.issuerSnapshot?.legalName || receipt.issuerSnapshot?.businessName || "Carwash"}</p>
                <p className="text-xs text-muted-foreground">RNC: {receipt.issuerSnapshot?.rnc || "Pendiente"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Cliente</p>
                <p className="font-medium">{receipt.customerSnapshot?.name || "Cliente"}</p>
                <p className="text-xs text-muted-foreground">{receipt.customerSnapshot?.phone || receipt.customerSnapshot?.email || "Sin contacto"}</p>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              {receipt.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-4"
                >
                  <div className="flex-1">
                    <p className="font-medium">{item.serviceName}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.quantity} x ${Number(item.unitPrice).toFixed(2)}
                    </p>
                  </div>
                  <span className="font-semibold">
                    ${Number(item.totalPrice).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-border pt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${Number(receipt.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>${Number(receipt.taxAmount).toFixed(2)}</span>
              </div>
              {receipt.discountAmount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="text-emerald-400">
                    -${Number(receipt.discountAmount).toFixed(2)}
                  </span>
                </div>
              )}
              {receipt.tipAmount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tip</span>
                  <span>${Number(receipt.tipAmount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex items-center justify-between border-t border-border pt-2 text-base font-bold">
                <span>Total</span>
                <span>${Number(receipt.totalAmount).toFixed(2)}</span>
              </div>
            </div>

            <p className="text-center text-xs text-muted-foreground pt-2">
              Issued at {new Date(receipt.issuedAt).toLocaleString()}
            </p>

            <Button
              type="button"
              variant="outline"
              className="w-full gap-2"
              onClick={() => window.open(`/receipts/${receipt.id}/print`, "_blank")}
            >
              <ReceiptIcon className="h-4 w-4" />
              Print Fiscal Invoice
            </Button>

            <Button
              type="button"
              className="w-full gap-2"
              onClick={() => window.open(`/api/receipts/${receipt.id}/invoice.xlsx`, "_blank")}
            >
              <Download className="h-4 w-4" />
              Download Fiscal Excel
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
