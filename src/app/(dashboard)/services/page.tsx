"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { useAuthStore } from "@/lib/auth/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import type { Service } from "@/lib/types";
import {
  Wrench,
  Plus,
  X,
  AlertCircle,
  Clock,
  DollarSign,
  Trash2,
  Edit3,
} from "lucide-react";

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    basePrice: "",
    durationMinutes: "",
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);

  const canCreate = useAuthStore.getState().hasPermission("services", "create");
  const canUpdate = useAuthStore.getState().hasPermission("services", "update");
  const canDelete = useAuthStore.getState().hasPermission("services", "delete");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await apiFetch<{ data: Service[] }>("/services");
        if (!cancelled) setServices(res.data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load services");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  function openCreate() {
    setEditing(null);
    setForm({ name: "", description: "", basePrice: "", durationMinutes: "", isActive: true });
    setShowForm(true);
  }

  function openEdit(s: Service) {
    setEditing(s);
    setForm({
      name: s.name,
      description: s.description || "",
      basePrice: String(s.basePrice),
      durationMinutes: String(s.durationMinutes),
      isActive: s.isActive !== false,
    });
    setShowForm(true);
  }

  const filteredServices = services.filter((service) => {
    const matchesSearch =
      !search.trim() ||
      [service.name, service.description || ""].join(" ").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = showInactive || service.isActive !== false;
    return matchesSearch && matchesStatus;
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        basePrice: Number(form.basePrice),
        durationMinutes: Number(form.durationMinutes),
        isActive: form.isActive,
      };
      if (editing) {
        await apiFetch(`/services/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        setServices((prev) =>
          prev.map((s) =>
            s.id === editing.id ? { ...s, ...payload } : s
          )
        );
      } else {
        const res = await apiFetch<{ data: Service }>("/services", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setServices((prev) => [...prev, res.data]);
      }
      setShowForm(false);
      setEditing(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save service");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleService(service: Service) {
    try {
      await apiFetch(`/services/${service.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: service.isActive === false ? true : false }),
      });
      setServices((prev) =>
        prev.map((entry) =>
          entry.id === service.id
            ? { ...entry, isActive: service.isActive === false ? true : false }
            : entry
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update service");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this service?")) return;
    try {
      await apiFetch(`/services/${id}`, { method: "DELETE" });
      setServices((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete service");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Wrench className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-semibold tracking-tight">Services</h1>
        </div>
        {canCreate && (
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            New Service
          </Button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search services..."
          className="max-w-sm"
        />
        <Button variant="outline" onClick={() => setShowInactive((current) => !current)}>
          {showInactive ? "Hide Inactive" : "Show Inactive"}
        </Button>
      </div>

      {showForm && (
        <Card className="bg-card/60 border-border/60">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {editing ? "Edit Service" : "New Service"}
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowForm(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                    placeholder="Premium Wash"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={form.description}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, description: e.target.value }))
                    }
                    placeholder="Full exterior and interior cleaning"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="basePrice">Price ($)</Label>
                  <Input
                    id="basePrice"
                    type="number"
                    step="0.01"
                    value={form.basePrice}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, basePrice: e.target.value }))
                    }
                    placeholder="25.00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="active">Status</Label>
                  <select
                    id="active"
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={form.isActive ? "active" : "inactive"}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, isActive: e.target.value === "active" }))
                    }
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="durationMinutes">Duration (min)</Label>
                  <Input
                    id="durationMinutes"
                    type="number"
                    value={form.durationMinutes}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        durationMinutes: e.target.value,
                      }))
                    }
                    placeholder="30"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Saving..." : editing ? "Update" : "Save"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/30 py-16 text-center">
          <Wrench className="h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">No services found</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredServices.map((s) => (
            <Card
              key={s.id}
              className="bg-card/60 border-border/60 transition-colors hover:border-primary/30"
            >
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{s.name}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-xs ${s.isActive === false ? "bg-zinc-500/15 text-zinc-400" : "bg-emerald-500/15 text-emerald-400"}`}>
                        {s.isActive === false ? "Inactive" : "Active"}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {s.description || "No description"}
                    </p>
                  </div>
                  {(canUpdate || canDelete) && (
                    <div className="flex items-center gap-1">
                      {canUpdate && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(s)}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDelete(s.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                      {canUpdate && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => toggleService(s)}
                        >
                          <Clock className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <DollarSign className="h-4 w-4 text-emerald-400" />
                    <span className="font-medium text-foreground">
                      ${Number(s.basePrice).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>{s.durationMinutes} min</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
