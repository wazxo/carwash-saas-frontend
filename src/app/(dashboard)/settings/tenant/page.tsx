"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { useAuthStore } from "@/lib/auth/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Building2, CheckCircle2, MapPin, Settings, Sparkles, Wrench } from "lucide-react";
import type { ApiResponse, Location, Service } from "@/lib/types";

type TenantSettingsShape = {
  businessPhone?: string;
  businessEmail?: string;
  businessAddress?: string;
  currency?: string;
  timezone?: string;
  onboardingCompleted?: boolean;
};

type TenantRecord = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  settings?: TenantSettingsShape;
};

const defaultServices = [
  {
    name: "Basic Wash",
    description: "Exterior wash for walk-in customers.",
    basePrice: 12,
    durationMinutes: 20,
  },
  {
    name: "Premium Wash",
    description: "Exterior and interior wash with tire shine.",
    basePrice: 25,
    durationMinutes: 40,
  },
  {
    name: "Detailing",
    description: "Deep cleaning package for scheduled appointments.",
    basePrice: 65,
    durationMinutes: 90,
  },
];

export default function TenantSettingsPage() {
  const { user } = useAuthStore();
  const [tenant, setTenant] = useState<TenantRecord | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingBusiness, setSavingBusiness] = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);
  const [savingService, setSavingService] = useState(false);

  const [businessForm, setBusinessForm] = useState({
    name: "",
    slug: "",
    description: "",
    businessPhone: "",
    businessEmail: "",
    businessAddress: "",
    currency: "USD",
    timezone: "UTC",
  });

  const [locationForm, setLocationForm] = useState({
    name: "Main Location",
    address: "",
    phone: "",
  });

  const [serviceForm, setServiceForm] = useState({
    name: defaultServices[0].name,
    description: defaultServices[0].description,
    basePrice: String(defaultServices[0].basePrice),
    durationMinutes: String(defaultServices[0].durationMinutes),
  });

  async function loadSetupData(tenantId: string) {
    const [tenantRes, locationsRes, servicesRes] = await Promise.all([
      apiFetch<ApiResponse<TenantRecord>>(`/tenants/${tenantId}`),
      apiFetch<{ data: Location[] }>("/locations"),
      apiFetch<{ data: Service[] }>("/services"),
    ]);

    const tenantData = tenantRes.data;
    const settings = tenantData.settings || {};

    setTenant(tenantData);
    setLocations(locationsRes.data);
    setServices(servicesRes.data);
    setBusinessForm({
      name: tenantData.name || "",
      slug: tenantData.slug || "",
      description: tenantData.description || "",
      businessPhone: settings.businessPhone || "",
      businessEmail: settings.businessEmail || "",
      businessAddress: settings.businessAddress || "",
      currency: settings.currency || "USD",
      timezone: settings.timezone || "UTC",
    });

    if (locationsRes.data[0]) {
      setLocationForm({
        name: locationsRes.data[0].name || "Main Location",
        address: locationsRes.data[0].address || "",
        phone: locationsRes.data[0].phone || "",
      });
    }
  }

  useEffect(() => {
    const tenantId = user?.tenantId;
    if (!tenantId) return;
    let cancelled = false;

    async function fetchTenant() {
      setLoading(true);
      try {
        const [tenantRes, locationsRes, servicesRes] = await Promise.all([
          apiFetch<ApiResponse<TenantRecord>>(`/tenants/${tenantId}`),
          apiFetch<{ data: Location[] }>("/locations"),
          apiFetch<{ data: Service[] }>("/services"),
        ]);

        if (!cancelled) {
          const tenantData = tenantRes.data;
          const settings = tenantData.settings || {};

          setTenant(tenantData);
          setLocations(locationsRes.data);
          setServices(servicesRes.data);
          setBusinessForm({
            name: tenantData.name || "",
            slug: tenantData.slug || "",
            description: tenantData.description || "",
            businessPhone: settings.businessPhone || "",
            businessEmail: settings.businessEmail || "",
            businessAddress: settings.businessAddress || "",
            currency: settings.currency || "USD",
            timezone: settings.timezone || "UTC",
          });

          if (locationsRes.data[0]) {
            setLocationForm({
              name: locationsRes.data[0].name || "Main Location",
              address: locationsRes.data[0].address || "",
              phone: locationsRes.data[0].phone || "",
            });
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load tenant");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchTenant();

    return () => {
      cancelled = true;
    };
  }, [user?.tenantId]);

  const setupChecklist = useMemo(
    () => [
      {
        label: "Business profile",
        done: Boolean(
          businessForm.name &&
            businessForm.businessPhone &&
            businessForm.businessEmail &&
            businessForm.businessAddress
        ),
      },
      {
        label: "At least one location",
        done: locations.length > 0,
      },
      {
        label: "At least one service",
        done: services.length > 0,
      },
    ],
    [businessForm, locations.length, services.length]
  );

  const completedSteps = setupChecklist.filter((item) => item.done).length;

  const markOnboardingComplete = async (tenantId: string) => {
    await apiFetch<ApiResponse<TenantRecord>>(`/tenants/${tenantId}`, {
      method: "PATCH",
      body: JSON.stringify({
        settings: {
          ...(tenant?.settings || {}),
          onboardingCompleted: true,
          businessPhone: businessForm.businessPhone,
          businessEmail: businessForm.businessEmail,
          businessAddress: businessForm.businessAddress,
          currency: businessForm.currency,
          timezone: businessForm.timezone,
        },
      }),
    });
  };

  const handleBusinessSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.tenantId) return;
    setSavingBusiness(true);
    setError(null);
    try {
      await apiFetch<ApiResponse<TenantRecord>>(`/tenants/${user.tenantId}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: businessForm.name,
          slug: businessForm.slug,
          description: businessForm.description,
          settings: {
            ...(tenant?.settings || {}),
            businessPhone: businessForm.businessPhone,
            businessEmail: businessForm.businessEmail,
            businessAddress: businessForm.businessAddress,
            currency: businessForm.currency,
            timezone: businessForm.timezone,
          },
        }),
      });

      if (completedSteps >= 2) {
        await markOnboardingComplete(user.tenantId);
      }

      await loadSetupData(user.tenantId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update tenant");
    } finally {
      setSavingBusiness(false);
    }
  };

  const handleLocationCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.tenantId) return;
    setSavingLocation(true);
    setError(null);
    try {
      await apiFetch<{ data: Location }>("/locations", {
        method: "POST",
        body: JSON.stringify(locationForm),
      });

      if (completedSteps >= 2) {
        await markOnboardingComplete(user.tenantId);
      }

      await loadSetupData(user.tenantId);
      setLocationForm({ name: "Main Location", address: "", phone: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create location");
    } finally {
      setSavingLocation(false);
    }
  };

  const handleServiceCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.tenantId) return;
    setSavingService(true);
    setError(null);
    try {
      await apiFetch<{ data: Service }>("/services", {
        method: "POST",
        body: JSON.stringify({
          name: serviceForm.name,
          description: serviceForm.description,
          basePrice: Number(serviceForm.basePrice),
          durationMinutes: Number(serviceForm.durationMinutes),
        }),
      });

      if (completedSteps >= 2) {
        await markOnboardingComplete(user.tenantId);
      }

      await loadSetupData(user.tenantId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create service");
    } finally {
      setSavingService(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Business Setup</h1>
            <p className="text-sm text-muted-foreground">
              Configure the business profile, first location, and starter services so the team can start operating immediately.
            </p>
          </div>
        </div>
        {!loading && tenant?.settings?.onboardingCompleted && (
          <Badge variant="secondary" className="gap-1 px-3 py-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Setup Completed
          </Badge>
        )}
      </div>

      {loading && (
        <div className="grid gap-4 xl:grid-cols-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-64 w-full" />
          ))}
        </div>
      )}

      {error && <p className="text-destructive text-sm">{error}</p>}

      {!loading && tenant && (
        <>
          <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
            <Card className="bg-card/60 border-border/60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Setup Checklist
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background/40 px-4 py-3">
                  <div>
                    <p className="font-medium">Progress</p>
                    <p className="text-sm text-muted-foreground">
                      {completedSteps} of {setupChecklist.length} setup tasks completed
                    </p>
                  </div>
                  <div className="text-2xl font-semibold">{Math.round((completedSteps / setupChecklist.length) * 100)}%</div>
                </div>
                <div className="space-y-3">
                  {setupChecklist.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between rounded-xl border border-border/60 bg-background/40 px-4 py-3"
                    >
                      <span className="text-sm font-medium">{item.label}</span>
                      <Badge variant={item.done ? "default" : "secondary"}>
                        {item.done ? "Done" : "Pending"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/60 border-border/60">
              <CardHeader>
                <CardTitle className="text-base">Current Setup</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="rounded-xl border border-border/60 bg-background/40 px-4 py-3">
                  <p className="text-muted-foreground">Business</p>
                  <p className="font-medium">{tenant.name}</p>
                  <p className="text-muted-foreground">{tenant.slug}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-border/60 bg-background/40 px-4 py-3">
                    <p className="text-muted-foreground">Locations</p>
                    <p className="text-xl font-semibold">{locations.length}</p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-background/40 px-4 py-3">
                    <p className="text-muted-foreground">Services</p>
                    <p className="text-xl font-semibold">{services.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <Card className="bg-card/60 border-border/60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="h-4 w-4 text-primary" />
                  Business Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleBusinessSave} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Business Name</Label>
                    <Input
                      value={businessForm.name}
                      onChange={(e) =>
                        setBusinessForm((current) => ({ ...current, name: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Slug</Label>
                    <Input
                      value={businessForm.slug}
                      onChange={(e) =>
                        setBusinessForm((current) => ({ ...current, slug: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      value={businessForm.description}
                      onChange={(e) =>
                        setBusinessForm((current) => ({ ...current, description: e.target.value }))
                      }
                      placeholder="Describe the business briefly"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Business Phone</Label>
                    <Input
                      value={businessForm.businessPhone}
                      onChange={(e) =>
                        setBusinessForm((current) => ({ ...current, businessPhone: e.target.value }))
                      }
                      placeholder="Main contact phone"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Business Email</Label>
                    <Input
                      type="email"
                      value={businessForm.businessEmail}
                      onChange={(e) =>
                        setBusinessForm((current) => ({ ...current, businessEmail: e.target.value }))
                      }
                      placeholder="operations@business.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Business Address</Label>
                    <Input
                      value={businessForm.businessAddress}
                      onChange={(e) =>
                        setBusinessForm((current) => ({ ...current, businessAddress: e.target.value }))
                      }
                      placeholder="Main office or branch address"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Currency</Label>
                      <Input
                        value={businessForm.currency}
                        onChange={(e) =>
                          setBusinessForm((current) => ({ ...current, currency: e.target.value.toUpperCase() }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Timezone</Label>
                      <Input
                        value={businessForm.timezone}
                        onChange={(e) =>
                          setBusinessForm((current) => ({ ...current, timezone: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={savingBusiness} className="w-full">
                    {savingBusiness ? "Saving..." : "Save Business Profile"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="bg-card/60 border-border/60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="h-4 w-4 text-primary" />
                  First Location
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleLocationCreate} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Location Name</Label>
                    <Input
                      value={locationForm.name}
                      onChange={(e) =>
                        setLocationForm((current) => ({ ...current, name: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Input
                      value={locationForm.address}
                      onChange={(e) =>
                        setLocationForm((current) => ({ ...current, address: e.target.value }))
                      }
                      placeholder="Street and area"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      value={locationForm.phone}
                      onChange={(e) =>
                        setLocationForm((current) => ({ ...current, phone: e.target.value }))
                      }
                      placeholder="Location phone"
                    />
                  </div>
                  <Button type="submit" disabled={savingLocation} className="w-full">
                    {savingLocation ? "Saving..." : "Create Location"}
                  </Button>
                </form>

                {locations.length > 0 && (
                  <div className="space-y-2 rounded-xl border border-border/60 bg-background/40 p-3 text-sm">
                    <p className="font-medium">Existing locations</p>
                    {locations.slice(0, 4).map((location) => (
                      <div key={location.id} className="flex items-center justify-between gap-3">
                        <span>{location.name}</span>
                        <span className="text-muted-foreground">{location.address || "No address"}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card/60 border-border/60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Wrench className="h-4 w-4 text-primary" />
                  Starter Service
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2 sm:grid-cols-3">
                  {defaultServices.map((preset) => (
                    <Button
                      key={preset.name}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setServiceForm({
                          name: preset.name,
                          description: preset.description,
                          basePrice: String(preset.basePrice),
                          durationMinutes: String(preset.durationMinutes),
                        })
                      }
                    >
                      {preset.name}
                    </Button>
                  ))}
                </div>
                <form onSubmit={handleServiceCreate} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Service Name</Label>
                    <Input
                      value={serviceForm.name}
                      onChange={(e) =>
                        setServiceForm((current) => ({ ...current, name: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      value={serviceForm.description}
                      onChange={(e) =>
                        setServiceForm((current) => ({ ...current, description: e.target.value }))
                      }
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Base Price</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={serviceForm.basePrice}
                        onChange={(e) =>
                          setServiceForm((current) => ({ ...current, basePrice: e.target.value }))
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Duration (min)</Label>
                      <Input
                        type="number"
                        value={serviceForm.durationMinutes}
                        onChange={(e) =>
                          setServiceForm((current) => ({ ...current, durationMinutes: e.target.value }))
                        }
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={savingService} className="w-full">
                    {savingService ? "Saving..." : "Create Service"}
                  </Button>
                </form>

                {services.length > 0 && (
                  <div className="space-y-2 rounded-xl border border-border/60 bg-background/40 p-3 text-sm">
                    <p className="font-medium">Existing services</p>
                    {services.slice(0, 4).map((service) => (
                      <div key={service.id} className="flex items-center justify-between gap-3">
                        <span>{service.name}</span>
                        <span className="text-muted-foreground">
                          ${Number(service.basePrice).toFixed(2)} • {service.durationMinutes} min
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
