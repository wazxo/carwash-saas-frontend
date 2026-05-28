"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api/client";
import { normalizeMediaUrl } from "@/lib/utils";
import type { ApiResponse, Receipt } from "@/lib/types";
import { useAuthStore } from "@/lib/auth/store";

export default function PrintReceiptPage() {
  const params = useParams<{ id: string }>();
  const receiptId = Array.isArray(params.id) ? params.id[0] : params.id;
  const accessToken = useAuthStore((state) => state.accessToken);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!receiptId) return;
    let cancelled = false;

    async function loadReceipt() {
      await new Promise((resolve) => setTimeout(resolve, 100));

      if (!useAuthStore.getState().accessToken) {
        if (!cancelled) {
          setError("No active session found. Open the invoice from a logged-in tab and try again.");
          setLoading(false);
        }
        return;
      }

      try {
        const res = await apiFetch<ApiResponse<Receipt>>(`/receipts/${receiptId}`, {
          suppressAuthRedirect: true,
        });
        if (!cancelled) setReceipt(res.data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load fiscal invoice");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadReceipt();

    return () => {
      cancelled = true;
    };
  }, [receiptId, accessToken]);

  useEffect(() => {
    if (!loading && receipt) {
      window.print();
    }
  }, [loading, receipt]);

  const logoUrl = useMemo(
    () => normalizeMediaUrl((receipt?.issuerSnapshot?.logoUrl as string | null | undefined) || null),
    [receipt?.issuerSnapshot]
  );

  if (loading) {
    return <div className="p-8 text-sm text-muted-foreground">Loading invoice...</div>;
  }

  if (error || !receipt) {
    return <div className="p-8 text-sm text-red-400">{error || "Invoice not found."}</div>;
  }

  return (
    <div className="min-h-screen bg-white px-8 py-10 text-black print:p-6">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex items-start justify-between gap-8 border-b pb-6">
          <div className="space-y-3">
            {logoUrl ? (
              <Image src={logoUrl} alt="Tenant logo" width={180} height={90} unoptimized className="max-h-24 w-auto object-contain" />
            ) : null}
            <div>
              <h1 className="text-2xl font-bold">{String(receipt.issuerSnapshot?.legalName || receipt.issuerSnapshot?.businessName || 'Carwash')}</h1>
              <p className="text-sm">RNC: {String(receipt.issuerSnapshot?.rnc || 'Pendiente')}</p>
            </div>
          </div>
          <div className="text-right text-sm">
            <p className="text-xl font-bold">FACTURA FISCAL</p>
            <p>NCF: {receipt.ncf || 'Pendiente'}</p>
            <p>Tipo: {receipt.fiscalDocumentType || 'B02'}</p>
            <p>Recibo: {receipt.receiptNumber}</p>
            <p>Fecha: {new Date(receipt.issuedAt).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 text-sm">
          <div className="rounded border p-4">
            <p className="font-semibold">Cliente</p>
            <p>{String(receipt.customerSnapshot?.name || 'Cliente')}</p>
            <p>RNC/Cédula: {String(receipt.customerSnapshot?.taxId || 'No especificado')}</p>
            <p>{String(receipt.customerSnapshot?.email || '')}</p>
            <p>{String(receipt.customerSnapshot?.phone || '')}</p>
          </div>
          <div className="rounded border p-4">
            <p className="font-semibold">Comprobante</p>
            <p>NCF: {receipt.ncf || 'Pendiente'}</p>
            <p>Tipo fiscal: {receipt.fiscalDocumentType || 'B02'}</p>
            <p>Emitido: {new Date(receipt.issuedAt).toLocaleString()}</p>
          </div>
        </div>

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-black">
              <th className="px-3 py-2 text-left">Servicio</th>
              <th className="px-3 py-2 text-right">Cant.</th>
              <th className="px-3 py-2 text-right">Precio</th>
              <th className="px-3 py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {receipt.items.map((item, index) => (
              <tr key={`${item.serviceName}-${index}`} className="border-b">
                <td className="px-3 py-2">{item.serviceName}</td>
                <td className="px-3 py-2 text-right">{item.quantity}</td>
                <td className="px-3 py-2 text-right">${Number(item.unitPrice).toFixed(2)}</td>
                <td className="px-3 py-2 text-right">${Number(item.totalPrice).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="ml-auto w-full max-w-sm space-y-2 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>${Number(receipt.subtotal).toFixed(2)}</span></div>
          <div className="flex justify-between"><span>ITBIS</span><span>${Number(receipt.taxAmount).toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Descuento</span><span>${Number(receipt.discountAmount).toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Propina</span><span>${Number(receipt.tipAmount).toFixed(2)}</span></div>
          <div className="flex justify-between border-t-2 border-black pt-2 text-lg font-bold"><span>Total</span><span>${Number(receipt.totalAmount).toFixed(2)}</span></div>
        </div>

        <div className="border-t pt-4 text-xs text-slate-600">
          <p>Documento emitido desde WashOS con formato fiscal orientado a República Dominicana.</p>
        </div>
      </div>
    </div>
  );
}
