"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, MapPin, Phone, Trash2, Pencil, Power } from "lucide-react";
import type { Location, ApiResponse } from "@/lib/types";

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({ name: "", address: "", phone: "" });

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<ApiResponse<Location[]>>("/locations");
      setLocations(res.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load locations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    async function loadLocations() {
      setLoading(true);
      try {
        const res = await apiFetch<ApiResponse<Location[]>>("/locations");
        if (!cancelled) setLocations(res.data ?? []);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load locations");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadLocations();
    return () => {
      cancelled = true;
    };
  }, []);

  const resetForm = () => {
    setShowForm(false);
    setEditingLocation(null);
    setForm({ name: "", address: "", phone: "" });
  };

  const openCreate = () => {
    setError(null);
    resetForm();
    setShowForm(true);
  };

  const openEdit = (location: Location) => {
    setError(null);
    setEditingLocation(location);
    setForm({
      name: location.name,
      address: location.address || "",
      phone: location.phone || "",
    });
    setShowForm(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiFetch<ApiResponse<Location>>(editingLocation ? `/locations/${editingLocation.id}` : "/locations", {
        method: editingLocation ? "PATCH" : "POST",
        body: JSON.stringify(form),
      });
      resetForm();
      fetchLocations();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save location");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleLocation = async (location: Location) => {
    try {
      await apiFetch<ApiResponse<Location>>(`/locations/${location.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: location.isActive === false ? true : false }),
      });
      fetchLocations();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update location status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this location?")) return;
    try {
      await apiFetch<ApiResponse<unknown>>(`/locations/${id}`, { method: "DELETE" });
      fetchLocations();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete location");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Locations</h1>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add Location
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{editingLocation ? "Edit Location" : "Create Location"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="md:col-span-3">
                <div className="flex gap-2">
                  <Button type="submit" disabled={submitting}>{submitting ? "Saving..." : editingLocation ? "Save Changes" : "Create"}</Button>
                  <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      )}

      {error && <p className="text-destructive text-sm">{error}</p>}

      {!loading && locations.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <MapPin className="w-10 h-10 mb-3 opacity-50" />
          <p>No locations found.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {locations.map((loc) => (
          <Card key={loc.id}>
            <CardHeader>
              <CardTitle className="text-base">{loc.name}</CardTitle>
            </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Status</span>
                  <span className={`text-xs font-medium ${loc.isActive === false ? "text-muted-foreground" : "text-emerald-400"}`}>
                    {loc.isActive === false ? "Inactive" : "Active"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  {loc.address || "No address"}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="w-4 h-4" />
                {loc.phone || "No phone"}
              </div>
              </CardContent>
              <CardFooter className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => openEdit(loc)}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={() => toggleLocation(loc)}>
                  <Power className="w-4 h-4 mr-2" />
                  {loc.isActive === false ? "Activate" : "Deactivate"}
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(loc.id)}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
      </div>
    </div>
  );
}
