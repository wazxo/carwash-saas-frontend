"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldAlert } from "lucide-react";
import type { ApiResponse, PermissionEntry, RoleRecord } from "@/lib/types";

export default function RolesPage() {
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [permissionCatalog, setPermissionCatalog] = useState<PermissionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchRoles() {
      try {
        const [rolesRes, permissionsRes] = await Promise.all([
          apiFetch<ApiResponse<RoleRecord[]>>("/roles"),
          apiFetch<{ data: PermissionEntry[] }>("/permissions"),
        ]);
        if (!cancelled) {
          setRoles(rolesRes.data ?? []);
          setPermissionCatalog(permissionsRes.data ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load roles");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchRoles();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ShieldAlert className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-semibold tracking-tight">Roles & Permissions</h1>
      </div>

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      )}

      {error && <p className="text-destructive text-sm">{error}</p>}

      {!loading && roles.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <ShieldAlert className="w-10 h-10 mb-3 opacity-50" />
          <p>No roles found.</p>
        </div>
      )}

      {!loading && roles.length > 0 && (
        <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Role Matrix</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {roles.map((role) => {
                const permissions = role.permissions?.map((entry) => entry.permission) ?? [];
                return (
                  <div key={role.id} className="rounded-xl border border-border/60 bg-background/40 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium">{role.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {role.description || "No description"}
                        </p>
                      </div>
                      <div className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                        {permissions.length} permissions
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {permissions.length > 0 ? (
                        permissions.map((permission) => (
                          <span
                            key={permission.id}
                            className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs text-primary"
                          >
                            {permission.resource}:{permission.action}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">No permissions assigned</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Permission Catalog</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex max-h-[32rem] flex-wrap gap-2 overflow-y-auto">
                {permissionCatalog.map((permission) => (
                  <span
                    key={permission.id}
                    className="rounded-full border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground"
                  >
                    {permission.resource}:{permission.action}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
