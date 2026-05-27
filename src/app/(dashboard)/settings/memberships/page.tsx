"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Trash2 } from "lucide-react";
import type { ApiResponse, RoleRecord } from "@/lib/types";

interface Membership {
  id: string;
  user?: { firstName: string; lastName: string; email: string };
  role?: { name: string; id: string };
}

export default function MembershipsPage() {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingMembershipId, setUpdatingMembershipId] = useState<string | null>(null);

  const fetchMemberships = async () => {
    setLoading(true);
    try {
      const [membershipsRes, rolesRes] = await Promise.all([
        apiFetch<ApiResponse<Membership[]>>("/memberships"),
        apiFetch<ApiResponse<RoleRecord[]>>("/roles"),
      ]);
      setMemberships(membershipsRes.data ?? []);
      setRoles(rolesRes.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load memberships");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function loadMemberships() {
      setLoading(true);
      try {
        const [membershipsRes, rolesRes] = await Promise.all([
          apiFetch<ApiResponse<Membership[]>>("/memberships"),
          apiFetch<ApiResponse<RoleRecord[]>>("/roles"),
        ]);
        if (!cancelled) {
          setMemberships(membershipsRes.data ?? []);
          setRoles(rolesRes.data ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load memberships"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadMemberships();

    return () => {
      cancelled = true;
    };
  }, []);

  const changeRole = async (id: string, newRoleId: string) => {
    setUpdatingMembershipId(id);
    try {
      await apiFetch<ApiResponse<Membership>>(`/memberships/${id}/role`, {
        method: "PATCH",
        body: JSON.stringify({ roleId: newRoleId }),
      });
      await fetchMemberships();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setUpdatingMembershipId(null);
    }
  };

  const removeMembership = async (id: string) => {
    if (!confirm("Remove this member?")) return;
    try {
      await apiFetch<ApiResponse<unknown>>(`/memberships/${id}`, { method: "DELETE" });
      await fetchMemberships();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to remove member");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-semibold tracking-tight">Team Memberships</h1>
      </div>

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      )}

      {error && <p className="text-destructive text-sm">{error}</p>}

      {!loading && memberships.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Users className="w-10 h-10 mb-3 opacity-50" />
          <p>No memberships found.</p>
        </div>
      )}

      {!loading && memberships.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">User</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                <tbody>
                  {memberships.map((m) => (
                    <tr key={m.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3">
                        <div className="font-medium">{m.user?.firstName} {m.user?.lastName}</div>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          className="h-9 min-w-44 rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          value={m.role?.id || ""}
                          disabled={updatingMembershipId === m.id}
                          onChange={(e) => {
                            if (e.target.value && e.target.value !== m.role?.id) {
                              void changeRole(m.id, e.target.value);
                            }
                          }}
                        >
                          <option value="" disabled>
                            Select role
                          </option>
                          {roles.map((role) => (
                            <option key={role.id} value={role.id}>
                              {role.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{m.user?.email || "—"}</td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="sm" onClick={() => removeMembership(m.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
