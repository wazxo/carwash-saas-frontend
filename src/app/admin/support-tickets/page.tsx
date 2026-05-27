"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { LayoutDashboard, ArrowLeft, Shield, Building2, HelpCircle } from "lucide-react";
import type { PaginatedResponse } from "@/lib/types";

interface AdminSupportTicket {
  id: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  adminNotes?: string | null;
  tenant?: { name: string };
  user?: { email: string; firstName?: string | null; lastName?: string | null };
  createdAt: string;
}

const adminLinks = [
  { label: "Stats", href: "/admin", icon: LayoutDashboard },
  { label: "Tenants", href: "/admin/tenants", icon: Building2 },
  { label: "Audit Logs", href: "/admin/audit-logs", icon: Shield },
  { label: "Support Tickets", href: "/admin/support-tickets", icon: HelpCircle },
];

export default function AdminSupportTicketsPage() {
  const [tickets, setTickets] = useState<AdminSupportTicket[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [adminNotesDraft, setAdminNotesDraft] = useState<Record<string, string>>({});

  const fetchTickets = async (page = 1, status = statusFilter, priority = priorityFilter) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (status) params.set("status", status);
      if (priority) params.set("priority", priority);
      const res = await apiFetch<PaginatedResponse<AdminSupportTicket>>(`/admin/support-tickets?${params.toString()}`);
      setTickets(res.data ?? []);
      setMeta(res.meta ?? meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function loadInitialTickets() {
      setLoading(true);
      try {
        const res = await apiFetch<PaginatedResponse<AdminSupportTicket>>(`/admin/support-tickets?page=1&limit=20`);
        if (!cancelled) {
          setTickets(res.data ?? []);
          setMeta(res.meta ?? { total: 0, page: 1, limit: 20, totalPages: 1 });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load tickets");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadInitialTickets();

    return () => {
      cancelled = true;
    };
  }, []);

  const updateTicket = async (
    id: string,
    patch: { status?: string; priority?: string; adminNotes?: string }
  ) => {
    try {
      await apiFetch<{ data: AdminSupportTicket }>(`/admin/support-tickets/${id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      await fetchTickets(meta.page);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update ticket");
    }
  };

  const badgeTone = (value: string) => {
    switch (value.toLowerCase()) {
      case "high":
      case "open":
        return "destructive" as const;
      case "medium":
      case "resolved":
        return "default" as const;
      default:
        return "secondary" as const;
    }
  };

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
                    link.href === "/admin/support-tickets"
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
            <HelpCircle className="w-5 h-5 text-primary" />
            <span className="font-semibold text-sm">Support Tickets</span>
          </div>
        </div>
      </header>

      <main className="p-6 space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Global Support Tickets</h1>
            <p className="text-sm text-muted-foreground">Review and resolve tenant support issues across the SaaS.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              className="h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All statuses</option>
              <option value="open">Open</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            <select
              className="h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="">All priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <Button variant="outline" onClick={() => fetchTickets(1, statusFilter, priorityFilter)}>
              Apply
            </Button>
          </div>
        </div>

        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-36 w-full" />
            ))}
          </div>
        )}

        {error && <p className="text-destructive text-sm">{error}</p>}

        {!loading && tickets.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <HelpCircle className="w-10 h-10 mb-3 opacity-50" />
            <p>No support tickets found.</p>
          </div>
        )}

        <div className="space-y-4">
          {tickets.map((ticket) => (
            <Card key={ticket.id}>
              <CardContent className="p-4 space-y-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-1">
                    <div className="font-medium">{ticket.subject}</div>
                    <div className="text-sm text-muted-foreground">{ticket.tenant?.name || "—"}</div>
                    <div className="text-sm text-muted-foreground">{ticket.category}</div>
                    <div className="text-xs text-muted-foreground">
                      {ticket.user
                        ? [ticket.user.firstName, ticket.user.lastName].filter(Boolean).join(" ") || ticket.user.email
                        : "Unknown user"}
                      {ticket.user?.email ? ` • ${ticket.user.email}` : ""}
                    </div>
                    <div className="text-xs text-muted-foreground">{new Date(ticket.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={badgeTone(ticket.priority)}>{ticket.priority}</Badge>
                    <Badge variant={badgeTone(ticket.status)}>{ticket.status}</Badge>
                    <select
                      className="h-9 rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      value={ticket.priority}
                      onChange={(e) => updateTicket(ticket.id, { priority: e.target.value })}
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                    <select
                      className="h-9 rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      value={ticket.status}
                      onChange={(e) => updateTicket(ticket.id, { status: e.target.value })}
                    >
                      <option value="open">Open</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">{ticket.description}</div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    value={adminNotesDraft[ticket.id] ?? ticket.adminNotes ?? ""}
                    onChange={(e) =>
                      setAdminNotesDraft((current) => ({
                        ...current,
                        [ticket.id]: e.target.value,
                      }))
                    }
                    placeholder="Internal admin notes"
                  />
                  <Button
                    variant="outline"
                    onClick={() =>
                      updateTicket(ticket.id, {
                        adminNotes: adminNotesDraft[ticket.id] ?? ticket.adminNotes ?? "",
                      })
                    }
                  >
                    Save Notes
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {meta.totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={meta.page <= 1} onClick={() => fetchTickets(meta.page - 1)}>
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">Page {meta.page} of {meta.totalPages}</span>
            <Button variant="outline" size="sm" disabled={meta.page >= meta.totalPages} onClick={() => fetchTickets(meta.page + 1)}>
              Next
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
