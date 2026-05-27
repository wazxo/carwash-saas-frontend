"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Car,
  Wrench,
  MapPin,
} from "lucide-react";
import type { Appointment, ApiResponse, PaginatedResponse, Customer, Vehicle, Location, Service } from "@/lib/types";

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const [form, setForm] = useState({
    locationId: "",
    customerId: "",
    vehicleId: "",
    scheduledAt: "",
    services: "" as string,
    durationMinutes: "30",
    notes: "",
  });

  const filteredAppointments = appointments.filter((appointment) =>
    statusFilter === "all" ? true : appointment.status === statusFilter
  );

  function resetForm() {
    setShowForm(false);
    setEditingAppointment(null);
    setVehicles([]);
    setForm({ locationId: "", customerId: "", vehicleId: "", scheduledAt: "", services: "", durationMinutes: "30", notes: "" });
  }

  function openEdit(appointment: Appointment) {
    setEditingAppointment(appointment);
    setForm({
      locationId: appointment.locationId,
      customerId: appointment.customerId,
      vehicleId: appointment.vehicleId,
      scheduledAt: appointment.scheduledAt.slice(0, 16),
      services: appointment.services?.join(", ") || "",
      durationMinutes: String(appointment.durationMinutes || 30),
      notes: appointment.notes || "",
    });
    setShowForm(true);
  }

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const [appointmentsRes, customersRes, locationsRes] = await Promise.all([
        apiFetch<ApiResponse<Appointment[]>>("/appointments"),
        apiFetch<PaginatedResponse<Customer>>("/customers?page=1&limit=100"),
        apiFetch<{ data: Location[] }>("/locations"),
      ]);
      setAppointments(appointmentsRes.data ?? []);
      setCustomers(customersRes.data);
      setLocations(locationsRes.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load appointments"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    async function loadInitialData() {
      setLoading(true);
      try {
        const [appointmentsRes, customersRes, locationsRes] = await Promise.all([
          apiFetch<ApiResponse<Appointment[]>>("/appointments"),
          apiFetch<PaginatedResponse<Customer>>("/customers?page=1&limit=100"),
          apiFetch<{ data: Location[] }>("/locations"),
        ]);
        if (!cancelled) {
          setAppointments(appointmentsRes.data ?? []);
          setCustomers(customersRes.data);
          setLocations(locationsRes.data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load appointments"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadInitialData();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!showForm) return;
    let cancelled = false;
    async function loadRefs() {
      try {
        const [cRes, lRes, sRes] = await Promise.all([
          apiFetch<PaginatedResponse<Customer>>("/customers?page=1&limit=100"),
          apiFetch<{ data: Location[] }>("/locations"),
          apiFetch<{ data: Service[] }>("/services"),
        ]);
        if (!cancelled) {
          setCustomers(cRes.data);
          setLocations(lRes.data);
          setServices(sRes.data);
        }
      } catch {}
    }
    loadRefs();
    return () => { cancelled = true; };
  }, [showForm]);

  useEffect(() => {
    if (!form.customerId) {
      return;
    }
    let cancelled = false;
    async function loadVehicles() {
      try {
        const res = await apiFetch<{ data: Vehicle[] }>(`/vehicles/customer/${form.customerId}`);
        if (!cancelled) setVehicles(res.data);
      } catch {}
    }
    loadVehicles();
    return () => { cancelled = true; };
  }, [form.customerId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch<ApiResponse<Appointment>>(editingAppointment ? `/appointments/${editingAppointment.id}` : "/appointments", {
        method: editingAppointment ? "PATCH" : "POST",
        body: JSON.stringify({
          ...form,
          services: form.services.split(",").map((s) => s.trim()).filter(Boolean),
          durationMinutes: Number(form.durationMinutes),
        }),
      });
      resetForm();
      fetchAppointments();
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Failed to create appointment"
      );
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await apiFetch<ApiResponse<Appointment>>(`/appointments/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      fetchAppointments();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  const cancelAppointment = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this appointment?")) return;
    try {
      await apiFetch<ApiResponse<unknown>>(`/appointments/${id}`, {
        method: "DELETE",
      });
      fetchAppointments();
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Failed to cancel appointment"
      );
    }
  };

  const statusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "default";
      case "confirmed":
        return "secondary";
      case "cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Appointments</h1>
        <Button onClick={() => {
          setEditingAppointment(null);
          setShowForm(!showForm);
        }}>
          <Plus className="w-4 h-4 mr-2" />
          {showForm ? "Close" : "New Appointment"}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          ["all", "All"],
          ["pending", "Pending"],
          ["confirmed", "Confirmed"],
          ["completed", "Completed"],
          ["cancelled", "Cancelled"],
        ].map(([value, label]) => (
          <Button
            key={value}
            type="button"
            variant={statusFilter === value ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(value)}
          >
            {label}
          </Button>
        ))}
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{editingAppointment ? "Edit Appointment" : "Create Appointment"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <Label>Customer</Label>
                <select
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={form.customerId}
                  onChange={(e) => {
                    setForm({ ...form, customerId: e.target.value, vehicleId: "" });
                    setVehicles([]);
                  }}
                  required
                >
                  <option value="">Select customer...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Vehicle</Label>
                <select
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={form.vehicleId}
                  onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
                  required
                  disabled={!form.customerId || vehicles.length === 0}
                >
                  <option value="">{form.customerId ? (vehicles.length ? "Select vehicle..." : "No vehicles") : "Select customer first"}</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>{v.plateNumber} — {v.color} {v.make} {v.model}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Scheduled At</Label>
                <Input
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Services</Label>
                <select
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={form.services}
                  onChange={(e) => setForm({ ...form, services: e.target.value })}
                >
                  <option value="">Select service...</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} — ${Number(s.basePrice).toFixed(2)}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Duration (minutes)</Label>
                <Input
                  type="number"
                  value={form.durationMinutes}
                  onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Notes</Label>
                <Input
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <Button type="submit">Create</Button>
                <Button type="button" variant="outline" onClick={resetForm} className="ml-2">Cancel</Button>
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

      {!loading && appointments.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Calendar className="w-10 h-10 mb-3 opacity-50" />
          <p>No appointments yet.</p>
        </div>
      )}

      <div className="space-y-3">
        {filteredAppointments.map((appt) => (
          <Card key={appt.id}>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">
                      {appt.location?.name || locations.find((loc) => loc.id === appt.locationId)?.name || appt.locationId.slice(0, 8)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">
                      {appt.customer?.name || customers.find((customer) => customer.id === appt.customerId)?.name || appt.customerId.slice(0, 8)}
                    </span>
                    <Car className="w-4 h-4 text-muted-foreground ml-2" />
                    <span className="text-muted-foreground">
                      {appt.vehicle
                        ? `${appt.vehicle.plateNumber} — ${appt.vehicle.make} ${appt.vehicle.model}`
                        : appt.vehicleId.slice(0, 8)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    {new Date(appt.scheduledAt).toLocaleString()}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Wrench className="w-4 h-4 text-muted-foreground" />
                    {appt.services?.join(", ") || "—"}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={statusColor(appt.status)}>{appt.status}</Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEdit(appt)}
                    title="Edit"
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateStatus(appt.id, "confirmed")}
                    title="Confirm"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateStatus(appt.id, "completed")}
                    title="Complete"
                  >
                    <CheckCircle className="w-4 h-4 text-primary" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => cancelAppointment(appt.id)}
                    title="Cancel"
                  >
                    <XCircle className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
