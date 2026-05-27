"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { LayoutDashboard, ArrowLeft, Shield, Users, Building2, ClipboardList, HelpCircle } from "lucide-react";
import Link from "next/link";
import type { PaginatedResponse, ApiResponse } from "@/lib/types";

interface AdminTenant {
  id: string;
  name: string;
  slug: string;
  plan?: string;
  status?: string;
  createdAt?: string;
}

const adminLinks = [
  { label: "Stats", href: "/admin", icon: LayoutDashboard },
  { label: "Tenants", href: "/admin/tenants", icon: Building2 },
  { label: "Audit Logs", href: "/admin/audit-logs", icon: Shield },
  { label: "Support Tickets", href: "/admin/support-tickets", icon: HelpCircle },
];

export default function AdminTenantsPage() {
  const [tenants, setTenants] = useState<AdminTenant[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTenants = async (page = 1) => {
    setLoading(true);
    try {
      const res = await apiFetch<PaginatedResponse<AdminTenant>>(`/admin/tenants?page=${page}&limit=20`);
      setTenants(res.data ?? []);
      setMeta(res.meta ?? meta);
    } catch (err: any) {
      setError(err.message || "Failed to load tenants");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
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
                    link.href === "/admin/tenants"
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
            <Building2 className="w-5 h-5 text-primary" />
            <span className="font-semibold text-sm">Tenants</span>
          </div>
        </div>
      </header>

      <main className="p-6 space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">All Tenants</h1>

        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        )}

        {error && <p className="text-destructive text-sm">{error}</p>}

        {!loading && tenants.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Building2 className="w-10 h-10 mb-3 opacity-50" />
            <p>No tenants found.</p>
          </div>
        )}

        {!loading && tenants.length > 0 && (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Slug</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Plan</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Created</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenants.map((t) => (
                      <tr key={t.id} className="border-b border-border last:border-0">
                        <td className="px-4 py-3 font-medium">{t.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{t.slug}</td>
                        <td className="px-4 py-3 capitalize">{t.plan || "—"}</td>
                        <td className="px-4 py-3">
                          <Badge variant={t.status === "active" ? "default" : "secondary"}>{t.status || "—"}</Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <Link href={`/admin/tenants/${t.id}`}>
                            <Button size="sm" variant="ghost">View</Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {meta.totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={meta.page <= 1} onClick={() => fetchTenants(meta.page - 1)}>
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">Page {meta.page} of {meta.totalPages}</span>
            <Button variant="outline" size="sm" disabled={meta.page >= meta.totalPages} onClick={() => fetchTenants(meta.page + 1)}>
              Next
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
