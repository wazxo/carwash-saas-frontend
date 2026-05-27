"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LayoutDashboard, ArrowLeft, Shield, Building2, ClipboardList, HelpCircle } from "lucide-react";
import type { PaginatedResponse } from "@/lib/types";

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId?: string | null;
  user?: { email: string; firstName?: string | null; lastName?: string | null };
  tenant?: { id: string; name: string };
  createdAt: string;
}

const adminLinks = [
  { label: "Stats", href: "/admin", icon: LayoutDashboard },
  { label: "Tenants", href: "/admin/tenants", icon: Building2 },
  { label: "Audit Logs", href: "/admin/audit-logs", icon: Shield },
  { label: "Support Tickets", href: "/admin/support-tickets", icon: HelpCircle },
];

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 50, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState("");

  const fetchLogs = async (page = 1, action = actionFilter) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "50" });
      if (action.trim()) params.set("action", action.trim());
      const res = await apiFetch<PaginatedResponse<AuditLog>>(`/admin/audit-logs?${params.toString()}`);
      setLogs(res.data ?? []);
      setMeta(res.meta ?? meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function loadInitialLogs() {
      setLoading(true);
      try {
        const res = await apiFetch<PaginatedResponse<AuditLog>>(`/admin/audit-logs?page=1&limit=50`);
        if (!cancelled) {
          setLogs(res.data ?? []);
          setMeta(res.meta ?? { total: 0, page: 1, limit: 50, totalPages: 1 });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load audit logs");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadInitialLogs();

    return () => {
      cancelled = true;
    };
  }, []);

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
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    link.href === "/admin/audit-logs"
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary" />
            <span className="font-semibold text-sm">Audit Logs</span>
          </div>
        </div>
      </header>

      <main className="p-6 space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Audit Logs</h1>
            <p className="text-sm text-muted-foreground">Global activity across all tenants.</p>
          </div>
          <div className="flex gap-2">
            <Input
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              placeholder="Filter by action"
              className="w-56"
            />
            <Button onClick={() => fetchLogs(1, actionFilter)} variant="outline">
              Apply
            </Button>
          </div>
        </div>

        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        )}

        {error && <p className="text-destructive text-sm">{error}</p>}

        {!loading && logs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <ClipboardList className="w-10 h-10 mb-3 opacity-50" />
            <p>No audit logs found.</p>
          </div>
        )}

        {!loading && logs.length > 0 && (
          <div className="space-y-3">
            {logs.map((log) => (
              <Card key={log.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-medium">{log.action}</p>
                      <p className="text-sm text-muted-foreground">
                        {log.entity}
                        {log.entityId ? ` • ${log.entityId.slice(0, 8)}` : ""}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {log.tenant?.name || "Global"}
                      </p>
                    </div>
                    <div className="text-sm text-right text-muted-foreground">
                      <p>
                        {log.user
                          ? [log.user.firstName, log.user.lastName].filter(Boolean).join(" ") || log.user.email
                          : "System"}
                      </p>
                      <p>{new Date(log.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {meta.totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={meta.page <= 1} onClick={() => fetchLogs(meta.page - 1)}>
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">Page {meta.page} of {meta.totalPages}</span>
            <Button variant="outline" size="sm" disabled={meta.page >= meta.totalPages} onClick={() => fetchLogs(meta.page + 1)}>
              Next
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
