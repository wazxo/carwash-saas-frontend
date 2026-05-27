"use client";

import Image from "next/image";
import { useEffect, useState, useMemo } from "react";
import { apiFetch } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import type { Customer, Vehicle } from "@/lib/types";
import {
  Car,
  Search,
  Plus,
  X,
  AlertCircle,
  User,
  Palette,
  Calendar,
  Camera,
  Pencil,
} from "lucide-react";

export default function VehiclesPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plateSearch, setPlateSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [vehiclePhoto, setVehiclePhoto] = useState<File | null>(null);
  const [form, setForm] = useState({
    customerId: "",
    plateNumber: "",
    make: "",
    model: "",
    year: "",
    color: "",
    vehicleType: "sedan",
  });
  const [submitting, setSubmitting] = useState(false);

  const photoPreview = useMemo(
    () =>
      vehiclePhoto
        ? URL.createObjectURL(vehiclePhoto)
        : editingVehicle?.photoUrl || null,
    [vehiclePhoto, editingVehicle?.photoUrl]
  );

  useEffect(() => {
    return () => {
      if (vehiclePhoto && photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [vehiclePhoto, photoPreview]);

  async function refreshCustomers() {
    const res = await apiFetch<{ data: Customer[] }>("/customers?page=1&limit=100");
    setCustomers(res.data);
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await apiFetch<{ data: Customer[] }>("/customers?page=1&limit=100");
        if (!cancelled) setCustomers(res.data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load vehicles");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const allVehicles = useMemo(() => {
    const list: (Vehicle & { customerName: string })[] = [];
    customers.forEach((c) => {
      (c.vehicles || []).forEach((v) => {
        list.push({ ...v, customerName: c.name });
      });
    });
    return list;
  }, [customers]);

  const filtered = useMemo(() => {
    if (!plateSearch.trim()) return allVehicles;
    const q = plateSearch.toLowerCase();
    return allVehicles.filter(
      (v) =>
        v.plateNumber.toLowerCase().includes(q) ||
        v.make.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q)
    );
  }, [allVehicles, plateSearch]);

  function resetForm() {
    setForm({
      customerId: "",
      plateNumber: "",
      make: "",
      model: "",
      year: "",
      color: "",
      vehicleType: "sedan",
    });
    setEditingVehicle(null);
    setVehiclePhoto(null);
    setShowForm(false);
  }

  function openCreateForm() {
    setError(null);
    setShowForm(true);
    setEditingVehicle(null);
    setVehiclePhoto(null);
    setForm({
      customerId: "",
      plateNumber: "",
      make: "",
      model: "",
      year: "",
      color: "",
      vehicleType: "sedan",
    });
  }

  function openEditForm(vehicle: Vehicle) {
    setError(null);
    setShowForm(true);
    setEditingVehicle(vehicle);
    setVehiclePhoto(null);
    setForm({
      customerId: vehicle.customerId,
      plateNumber: vehicle.plateNumber,
      make: vehicle.make,
      model: vehicle.model,
      year: String(vehicle.year ?? ""),
      color: vehicle.color,
      vehicleType: vehicle.vehicleType || "sedan",
    });
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const body = new FormData();
      body.append("customerId", form.customerId);
      body.append("plateNumber", form.plateNumber);
      body.append("make", form.make);
      body.append("model", form.model);
      body.append("year", String(Number(form.year) || new Date().getFullYear()));
      body.append("color", form.color);
      body.append("vehicleType", form.vehicleType);
      if (vehiclePhoto) {
        body.append("photo", vehiclePhoto);
      }

      await apiFetch(editingVehicle ? `/vehicles/${editingVehicle.id}` : "/vehicles", {
        method: editingVehicle ? "PATCH" : "POST",
        body,
      });

      resetForm();
      await refreshCustomers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save vehicle");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Car className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-semibold tracking-tight">Vehicles</h1>
        </div>
        <Button onClick={openCreateForm} className="gap-2">
          <Plus className="h-4 w-4" />
          New Vehicle
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {showForm && (
        <Card className="bg-card/60 border-border/60">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {editingVehicle ? "Edit Vehicle" : "New Vehicle"}
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={resetForm}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="customerId">Customer</Label>
                  <select
                    id="customerId"
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={form.customerId}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, customerId: e.target.value }))
                    }
                    required
                  >
                    <option value="">Select customer</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plateNumber">Plate Number</Label>
                  <Input
                    id="plateNumber"
                    value={form.plateNumber}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, plateNumber: e.target.value }))
                    }
                    placeholder="ABC-123"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="make">Make</Label>
                  <Input
                    id="make"
                    value={form.make}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, make: e.target.value }))
                    }
                    placeholder="Toyota"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    value={form.model}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, model: e.target.value }))
                    }
                    placeholder="Corolla"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    type="number"
                    value={form.year}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, year: e.target.value }))
                    }
                    placeholder="2020"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vehicleType">Vehicle Type</Label>
                  <select
                    id="vehicleType"
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={form.vehicleType}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, vehicleType: e.target.value }))
                    }
                    required
                  >
                    <option value="sedan">Sedan</option>
                    <option value="suv">SUV</option>
                    <option value="pickup">Pickup</option>
                    <option value="van">Van</option>
                    <option value="motorcycle">Motorcycle</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-2 sm:col-span-2 lg:col-span-3">
                  <Label htmlFor="photo">Vehicle Photo</Label>
                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_160px]">
                    <div className="space-y-2">
                      <Input
                        id="photo"
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={(e) =>
                          setVehiclePhoto(e.target.files?.[0] || null)
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Optional. Allowed: JPG, PNG, WebP, GIF. Max 10 MB.
                      </p>
                    </div>
                    <div className="flex h-36 items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-background/40">
                      {photoPreview ? (
                        <Image
                          src={photoPreview}
                          alt="Vehicle preview"
                          width={160}
                          height={144}
                          unoptimized
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <Camera className="h-6 w-6" />
                          <span className="text-xs">No photo</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    value={form.color}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, color: e.target.value }))
                    }
                    placeholder="Silver"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting
                    ? "Saving..."
                    : editingVehicle
                      ? "Update Vehicle"
                      : "Save Vehicle"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by plate, make, or model..."
          value={plateSearch}
          onChange={(e) => setPlateSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/30 py-16 text-center">
          <Car className="h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">No vehicles found</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((v) => (
            <Card
              key={v.id}
              className="bg-card/60 border-border/60 transition-colors hover:border-primary/30"
            >
              <CardContent className="p-4 space-y-3">
                {v.photoUrl ? (
                  <div className="overflow-hidden rounded-xl border border-border/60 bg-background/30">
                    <Image
                      src={v.photoUrl}
                      alt={`${v.plateNumber} vehicle photo`}
                      width={640}
                      height={320}
                      unoptimized
                      className="h-40 w-full object-cover"
                    />
                  </div>
                ) : null}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Car className="h-5 w-5 text-primary" />
                    <span className="font-semibold">{v.plateNumber}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground capitalize">
                      {v.vehicleType}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEditForm(v)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5" />
                    {v.customerName}
                  </div>
                  <div className="flex items-center gap-2">
                    <Palette className="h-3.5 w-3.5" />
                    {v.color} {v.make} {v.model}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5" />
                    {v.year}
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
