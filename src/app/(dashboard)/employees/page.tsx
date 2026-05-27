"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Mail, Plus, Trash2, UserCog, TrendingUp } from "lucide-react";
import Link from "next/link";
import type { Employee, PaginatedResponse, ApiResponse, InvitationRecord, Location } from "@/lib/types";

type RoleOption = { id: string; name: string };
type EmployeeCreateResponse = Employee & {
  tempPassword?: string;
  message?: string;
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [invitations, setInvitations] = useState<InvitationRecord[]>([]);
  const [createdCredentials, setCreatedCredentials] = useState<{
    email: string;
    tempPassword?: string;
  } | null>(null);

  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  const [form, setForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    roleId: "",
    locationId: "",
    jobTitle: "",
    hourlyRate: "",
  });
  const [inviteForm, setInviteForm] = useState({ email: "", roleId: "", locationId: "" });

  const fetchEmployees = async (page = 1) => {
    setLoading(true);
    try {
      const res = await apiFetch<PaginatedResponse<Employee>>(`/employees?page=${page}&limit=10`);
      setEmployees(res.data ?? []);
      setMeta(res.meta ?? meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  const fetchInvitations = async () => {
    try {
      const res = await apiFetch<{ data: InvitationRecord[] }>("/auth/invite");
      setInvitations(res.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load invitations");
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function loadEmployees() {
      setLoading(true);
      try {
        const [employeesRes, invitationsRes] = await Promise.all([
          apiFetch<PaginatedResponse<Employee>>(`/employees?page=1&limit=10`),
          apiFetch<{ data: InvitationRecord[] }>("/auth/invite"),
        ]);
        if (!cancelled) {
          setEmployees(employeesRes.data ?? []);
          setMeta(employeesRes.meta ?? { total: 0, page: 1, limit: 10, totalPages: 1 });
          setInvitations(invitationsRes.data ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load employees");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadEmployees();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadRefs() {
      try {
        const [rRes, lRes] = await Promise.all([
          apiFetch<{ data: RoleOption[] }>("/roles"),
          apiFetch<{ data: Location[] }>("/locations"),
        ]);
        if (!cancelled) {
          setRoles(rRes.data);
          setLocations(lRes.data);
        }
      } catch {
        if (!cancelled) {
          setError("Failed to load roles and locations");
        }
      }
    }
    loadRefs();
    return () => { cancelled = true; };
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreatedCredentials(null);
      const res = await apiFetch<ApiResponse<EmployeeCreateResponse>>("/employees", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          hourlyRate: form.hourlyRate ? Number(form.hourlyRate) : undefined,
        }),
      });
      if (res.data?.tempPassword) {
        setCreatedCredentials({
          email: res.data.user.email,
          tempPassword: res.data.tempPassword,
        });
      }
      setShowForm(false);
      setForm({ email: "", firstName: "", lastName: "", roleId: "", locationId: "", jobTitle: "", hourlyRate: "" });
      fetchEmployees(meta.page);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create employee");
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch<ApiResponse<{ message: string }>>("/auth/invite", {
        method: "POST",
        body: JSON.stringify({
          email: inviteForm.email,
          roleId: inviteForm.roleId,
          locationId: inviteForm.locationId || undefined,
        }),
      });
      setInviteForm({ email: "", roleId: "", locationId: "" });
      await fetchInvitations();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to send invitation");
    }
  };

  const cancelInvitation = async (invitationId: string) => {
    if (!confirm("Cancel this invitation?")) return;
    try {
      await apiFetch<ApiResponse<InvitationRecord>>(`/auth/invite/${invitationId}`, {
        method: "DELETE",
      });
      await fetchInvitations();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to cancel invitation");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Employees</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" />
          {showForm ? "Close" : "Add Employee"}
        </Button>
      </div>

      {createdCredentials?.tempPassword && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          Temporary password for <span className="font-medium">{createdCredentials.email}</span>: <span className="font-mono">{createdCredentials.tempPassword}</span>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Invite Employee by Email
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <select
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={inviteForm.roleId}
                  onChange={(e) => setInviteForm({ ...inviteForm, roleId: e.target.value })}
                  required
                >
                  <option value="">Select role...</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <select
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={inviteForm.locationId}
                  onChange={(e) => setInviteForm({ ...inviteForm, locationId: e.target.value })}
                >
                  <option value="">Any location</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <Button type="submit">Send Invitation</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invitations</CardTitle>
          </CardHeader>
          <CardContent>
            {invitations.length === 0 ? (
              <div className="text-sm text-muted-foreground">No invitations yet.</div>
            ) : (
              <div className="space-y-3">
                {invitations.map((invitation) => (
                  <div key={invitation.id} className="flex flex-col gap-3 rounded-lg border border-border/60 bg-background/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium">{invitation.email}</p>
                      <p className="text-sm text-muted-foreground">
                        {invitation.role?.name || "Role pending"}
                        {invitation.location?.name ? ` • ${invitation.location.name}` : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {invitation.status} • expires {new Date(invitation.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={invitation.status === "pending" ? "default" : "secondary"}>
                        {invitation.status}
                      </Badge>
                      {invitation.status === "pending" && (
                        <Button variant="ghost" size="sm" onClick={() => cancelInvitation(invitation.id)}>
                          <Trash2 className="w-4 h-4 mr-1 text-destructive" />
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create Employee</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required type="email" />
              </div>
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <select
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={form.roleId}
                  onChange={(e) => setForm({ ...form, roleId: e.target.value })}
                  required
                >
                  <option value="">Select role...</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <select
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={form.locationId}
                  onChange={(e) => setForm({ ...form, locationId: e.target.value })}
                  required
                >
                  <option value="">Select location...</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Job Title</Label>
                <Input value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Hourly Rate</Label>
                <Input type="number" step="0.01" value={form.hourlyRate} onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <Button type="submit">Create</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      )}

      {error && <p className="text-destructive text-sm">{error}</p>}

      {!loading && employees.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <UserCog className="w-10 h-10 mb-3 opacity-50" />
          <p>No employees found.</p>
        </div>
      )}

      {!loading && employees.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Location</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Job Title</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Rate</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => (
                    <tr key={emp.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3">
                        {emp.user?.firstName} {emp.user?.lastName}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{emp.user?.email}</td>
                      <td className="px-4 py-3">{emp.role?.name || "—"}</td>
                      <td className="px-4 py-3">{emp.location?.name || "—"}</td>
                      <td className="px-4 py-3">{emp.jobTitle || "—"}</td>
                      <td className="px-4 py-3">{emp.hourlyRate ? `$${emp.hourlyRate}` : "—"}</td>
                      <td className="px-4 py-3">
                        <Badge variant={emp.isActive ? "default" : "secondary"}>
                          {emp.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/employees/${emp.id}/performance`}>
                          <Button size="sm" variant="ghost">
                            <TrendingUp className="w-4 h-4 mr-1" />
                            Performance
                          </Button>
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
          <Button
            variant="outline"
            size="sm"
            disabled={meta.page <= 1}
            onClick={() => fetchEmployees(meta.page - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {meta.page} of {meta.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={meta.page >= meta.totalPages}
            onClick={() => fetchEmployees(meta.page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
