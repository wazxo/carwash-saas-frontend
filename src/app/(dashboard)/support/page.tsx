"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { HelpCircle, Plus } from "lucide-react";
import type { SupportTicket, PaginatedResponse, ApiResponse } from "@/lib/types";

export default function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    subject: "",
    description: "",
    category: "general",
    priority: "medium",
  });

  const fetchTickets = async (page = 1) => {
    setLoading(true);
    try {
      const res = await apiFetch<PaginatedResponse<SupportTicket>>(`/support-tickets?page=${page}&limit=10`);
      setTickets(res.data ?? []);
      setMeta(res.meta ?? meta);
    } catch (err: any) {
      setError(err.message || "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch<ApiResponse<SupportTicket>>("/support-tickets", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setShowForm(false);
      setForm({ subject: "", description: "", category: "general", priority: "medium" });
      fetchTickets(meta.page);
    } catch (err: any) {
      alert(err.message || "Failed to create ticket");
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await apiFetch<ApiResponse<SupportTicket>>(`/support-tickets/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      fetchTickets(meta.page);
    } catch (err: any) {
      alert(err.message || "Failed to update ticket");
    }
  };

  const priorityColor = (p: string) => {
    switch (p.toLowerCase()) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      default:
        return "secondary";
    }
  };

  const statusColor = (s: string) => {
    switch (s.toLowerCase()) {
      case "open":
        return "default";
      case "resolved":
        return "secondary";
      case "closed":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Support Tickets</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" />
          {showForm ? "Close" : "New Ticket"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create Ticket</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <select
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Description</Label>
                <textarea
                  className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[100px]"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <Button type="submit">Submit Ticket</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      )}

      {error && <p className="text-destructive text-sm">{error}</p>}

      {!loading && tickets.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <HelpCircle className="w-10 h-10 mb-3 opacity-50" />
          <p>No support tickets yet.</p>
        </div>
      )}

      <div className="space-y-3">
        {tickets.map((ticket) => (
          <Card key={ticket.id}>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-medium">{ticket.subject}</div>
                  <div className="text-sm text-muted-foreground">{ticket.category}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(ticket.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={priorityColor(ticket.priority)}>{ticket.priority}</Badge>
                  <Badge variant={statusColor(ticket.status)}>{ticket.status}</Badge>
                  {ticket.status !== "resolved" && (
                    <Button size="sm" variant="outline" onClick={() => updateStatus(ticket.id, "resolved")}>
                      Resolve
                    </Button>
                  )}
                  {ticket.status !== "closed" && (
                    <Button size="sm" variant="outline" onClick={() => updateStatus(ticket.id, "closed")}>
                      Close
                    </Button>
                  )}
                </div>
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
    </div>
  );
}
