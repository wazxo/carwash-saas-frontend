"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { fiscalDocumentTypeHelp, validateDominicanTaxId } from "@/lib/fiscal";
import type { Customer, Location, Receipt, Service, Vehicle, WashOrder } from "@/lib/types";
import {
  AlertCircle,
  Camera,
  Car,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  DollarSign,
  Plus,
  Receipt as ReceiptIcon,
  Search,
  User,
  X,
} from "lucide-react";

type OrderItemDraft = { serviceId: string; quantity: number };

export default function FrontDeskPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [customerOrders, setCustomerOrders] = useState<WashOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [savingVehicle, setSavingVehicle] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [registeringPayment, setRegisteringPayment] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [currentOrder, setCurrentOrder] = useState<WashOrder | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  const [customerForm, setCustomerForm] = useState({
    name: "",
    phone: "",
    email: "",
    notes: "",
  });
  const [vehicleForm, setVehicleForm] = useState({
    plateNumber: "",
    make: "",
    model: "",
    year: "",
    color: "",
    vehicleType: "sedan",
  });
  const [vehiclePhoto, setVehiclePhoto] = useState<File | null>(null);
  const [orderForm, setOrderForm] = useState({
    locationId: "",
    notes: "",
    items: [{ serviceId: "", quantity: 1 }] as OrderItemDraft[],
    taxAmount: "0",
    discountAmount: "0",
    surchargeAmount: "0",
  });
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    method: "cash",
    tipAmount: "",
    fiscalDocumentType: "B02",
    customerLegalName: "",
    customerTaxId: "",
    customerEmail: "",
    customerPhone: "",
  });

  const vehiclePhotoPreview = useMemo(
    () => (vehiclePhoto ? URL.createObjectURL(vehiclePhoto) : null),
    [vehiclePhoto]
  );

  useEffect(() => {
    return () => {
      if (vehiclePhotoPreview) {
        URL.revokeObjectURL(vehiclePhotoPreview);
      }
    };
  }, [vehiclePhotoPreview]);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialData() {
      setLoading(true);
      try {
        const [customersRes, locationsRes, servicesRes] = await Promise.all([
          apiFetch<{ data: Customer[] }>("/customers?page=1&limit=100"),
          apiFetch<{ data: Location[] }>("/locations"),
          apiFetch<{ data: Service[] }>("/services"),
        ]);

        if (!cancelled) {
          setCustomers(customersRes.data);
          setLocations(locationsRes.data);
          setServices(servicesRes.data);
          setOrderForm((current) => ({
            ...current,
            locationId: current.locationId || locationsRes.data[0]?.id || "",
          }));
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load front desk data"
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
    if (!selectedCustomerId) return;
    let cancelled = false;

    async function loadCustomerData() {
      try {
        const [vehiclesRes, ordersRes] = await Promise.all([
          apiFetch<{ data: Vehicle[] }>(`/vehicles/customer/${selectedCustomerId}`),
          apiFetch<{ data: WashOrder[] }>(`/wash-orders?page=1&limit=100`),
        ]);
        if (!cancelled) {
          setVehicles(vehiclesRes.data);
          setCustomerOrders(
            ordersRes.data.filter(
              (order) =>
                order.customerId === selectedCustomerId &&
                !["delivered", "cancelled"].includes(order.status)
            )
          );
        }
      } catch (err) {
        if (!cancelled) {
          setVehicles([]);
          setCustomerOrders([]);
          setError(
            err instanceof Error ? err.message : "Failed to load customer vehicles"
          );
        }
      }
    }

    void loadCustomerData();

    return () => {
      cancelled = true;
    };
  }, [selectedCustomerId]);

  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers;
    const query = customerSearch.toLowerCase();
    return customers.filter((customer) =>
      [customer.name, customer.phone, customer.email || ""]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [customerSearch, customers]);

  const selectedCustomer = customers.find(
    (customer) => customer.id === selectedCustomerId
  );
  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === selectedVehicleId);

  const selectedOrderTotal = useMemo(() => {
    return orderForm.items.reduce((sum, item) => {
      const service = services.find((entry) => entry.id === item.serviceId);
      if (!service) return sum;
      return sum + Number(service.basePrice) * item.quantity;
    }, 0);
  }, [orderForm.items, services]);

  const currentOrderPaid = (currentOrder?.payments ?? []).reduce(
    (sum, payment) => sum + Number(payment.amount),
    0
  );
  const currentOrderRemaining = currentOrder
    ? Math.max(0, Number(currentOrder.finalAmount) - currentOrderPaid)
    : 0;
  const frontDeskTaxIdValidation = validateDominicanTaxId(paymentForm.customerTaxId);

  function resetDeskFlow() {
    setSelectedCustomerId("");
    setSelectedVehicleId("");
    setVehicles([]);
    setCustomerOrders([]);
    setCurrentOrder(null);
    setReceipt(null);
    setPaymentForm({ amount: "", method: "cash", tipAmount: "", fiscalDocumentType: "B02", customerLegalName: "", customerTaxId: "", customerEmail: "", customerPhone: "" });
    setOrderForm((current) => ({
      ...current,
      notes: "",
      items: [{ serviceId: "", quantity: 1 }],
      taxAmount: "0",
      discountAmount: "0",
      surchargeAmount: "0",
    }));
    setVehicleForm({
      plateNumber: "",
      make: "",
      model: "",
      year: "",
      color: "",
      vehicleType: "sedan",
    });
    setVehiclePhoto(null);
    setCustomerForm({ name: "", phone: "", email: "", notes: "" });
  }

  async function refreshCustomers() {
    const res = await apiFetch<{ data: Customer[] }>("/customers?page=1&limit=100");
    setCustomers(res.data);
    return res.data;
  }

  async function handleCreateCustomer(e: React.FormEvent) {
    e.preventDefault();
    setSavingCustomer(true);
    setError(null);
    try {
      const res = await apiFetch<{ data: Customer }>("/customers", {
        method: "POST",
        body: JSON.stringify(customerForm),
      });
      await refreshCustomers();
      setSelectedCustomerId(res.data.id);
      setCustomerSearch(res.data.name);
      setCustomerForm({ name: "", phone: "", email: "", notes: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create customer");
    } finally {
      setSavingCustomer(false);
    }
  }

  async function handleCreateVehicle(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCustomerId) {
      setError("Select or create a customer before adding a vehicle");
      return;
    }

    setSavingVehicle(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("customerId", selectedCustomerId);
      body.append("plateNumber", vehicleForm.plateNumber);
      body.append("make", vehicleForm.make);
      body.append("model", vehicleForm.model);
      body.append(
        "year",
        String(Number(vehicleForm.year) || new Date().getFullYear())
      );
      body.append("color", vehicleForm.color);
      body.append("vehicleType", vehicleForm.vehicleType);
      if (vehiclePhoto) body.append("photo", vehiclePhoto);

      const res = await apiFetch<{ data: Vehicle }>("/vehicles", {
        method: "POST",
        body,
      });
      const nextVehicles = await apiFetch<{ data: Vehicle[] }>(
        `/vehicles/customer/${selectedCustomerId}`
      );
      setVehicles(nextVehicles.data);
      setSelectedVehicleId(res.data.id);
      setVehicleForm({
        plateNumber: "",
        make: "",
        model: "",
        year: "",
        color: "",
        vehicleType: "sedan",
      });
      setVehiclePhoto(null);
      await refreshCustomers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create vehicle");
    } finally {
      setSavingVehicle(false);
    }
  }

  function addOrderItem() {
    setOrderForm((current) => ({
      ...current,
      items: [...current.items, { serviceId: "", quantity: 1 }],
    }));
  }

  function updateOrderItem(index: number, patch: Partial<OrderItemDraft>) {
    setOrderForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item
      ),
    }));
  }

  function removeOrderItem(index: number) {
    setOrderForm((current) => ({
      ...current,
      items: current.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  function loadOrderIntoForm(order: WashOrder) {
    setCurrentOrder(order);
    setSelectedVehicleId(order.vehicleId);
    setOrderForm({
      locationId: order.locationId,
      notes: order.notes || "",
      items: order.items.map((item) => ({ serviceId: item.serviceId, quantity: item.quantity })),
      taxAmount: String(order.taxAmount ?? 0),
      discountAmount: String(order.discountAmount ?? 0),
      surchargeAmount: String(order.surchargeAmount ?? 0),
    });
    setPaymentForm((current) => ({
      ...current,
      amount: Math.max(0, Number(order.finalAmount) - (order.payments ?? []).reduce((sum, payment) => sum + Number(payment.amount), 0)).toFixed(2),
      customerLegalName: selectedCustomer?.name || current.customerLegalName,
      customerEmail: selectedCustomer?.email || current.customerEmail,
      customerPhone: selectedCustomer?.phone || current.customerPhone,
    }));
  }

  const draftSubtotal = useMemo(() => {
    return orderForm.items.reduce((sum, item) => {
      const service = services.find((entry) => entry.id === item.serviceId);
      if (!service) return sum;
      return sum + Number(service.basePrice) * item.quantity;
    }, 0);
  }, [orderForm.items, services]);

  const draftTotal = Math.max(
    0,
    draftSubtotal + Number(orderForm.taxAmount || 0) + Number(orderForm.surchargeAmount || 0) - Number(orderForm.discountAmount || 0)
  );

  async function handleCreateOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCustomerId || !selectedVehicleId) {
      setError("Select a customer and vehicle before creating an order");
      return;
    }

    setCreatingOrder(true);
    setError(null);
    setReceipt(null);

    try {
      const response = await apiFetch<{ data: WashOrder }>(currentOrder ? `/wash-orders/${currentOrder.id}` : "/wash-orders", {
        method: currentOrder ? "PATCH" : "POST",
        body: JSON.stringify({
          locationId: orderForm.locationId,
          customerId: selectedCustomerId,
          vehicleId: selectedVehicleId,
          notes: orderForm.notes,
          items: orderForm.items.filter((item) => item.serviceId),
          taxAmount: Number(orderForm.taxAmount || 0),
          discountAmount: Number(orderForm.discountAmount || 0),
          surchargeAmount: Number(orderForm.surchargeAmount || 0),
        }),
      });

      setCurrentOrder(response.data);
      setPaymentForm((current) => ({
        ...current,
        amount: Number(response.data.finalAmount).toFixed(2),
        customerLegalName: selectedCustomer?.name || current.customerLegalName,
        customerTaxId: selectedCustomer?.taxId || current.customerTaxId,
        customerEmail: selectedCustomer?.email || current.customerEmail,
        customerPhone: selectedCustomer?.phone || current.customerPhone,
      }));

      const refreshedOrders = await apiFetch<{ data: WashOrder[] }>(`/wash-orders?page=1&limit=100`);
      setCustomerOrders(
        refreshedOrders.data.filter(
          (order) => order.customerId === selectedCustomerId && !["delivered", "cancelled"].includes(order.status)
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create order");
    } finally {
      setCreatingOrder(false);
    }
  }

  async function handleRegisterPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!currentOrder) {
      setError("Create an order before registering payment");
      return;
    }
    if (currentOrderRemaining <= 0) {
      setError("This order is already fully paid.");
      return;
    }
    if (paymentForm.customerTaxId && !frontDeskTaxIdValidation.valid) {
      setError("Customer tax ID must be a valid Dominican RNC or cédula.");
      return;
    }

    setRegisteringPayment(true);
    setError(null);

    try {
      await apiFetch("/payments", {
        method: "POST",
        body: JSON.stringify({
          orderId: currentOrder.id,
          amount: Number(paymentForm.amount),
          method: paymentForm.method,
          tipAmount: Number(paymentForm.tipAmount || 0),
          fiscalDocumentType: paymentForm.fiscalDocumentType,
          customerLegalName: paymentForm.customerLegalName || undefined,
          customerTaxId: paymentForm.customerTaxId || undefined,
          customerEmail: paymentForm.customerEmail || undefined,
          customerPhone: paymentForm.customerPhone || undefined,
        }),
      });

      const [orderRes, receiptRes] = await Promise.all([
        apiFetch<{ data: WashOrder }>(`/wash-orders/${currentOrder.id}`),
        apiFetch<{ data: Receipt[] }>(`/receipts/order/${currentOrder.id}`),
      ]);

      const nextPaid = (orderRes.data.payments ?? []).reduce(
        (sum, payment) => sum + Number(payment.amount),
        0
      );
      const nextRemaining = Math.max(0, Number(orderRes.data.finalAmount) - nextPaid);
      setCurrentOrder(orderRes.data);
      setPaymentForm((current) => ({
        ...current,
        amount: nextRemaining > 0 ? nextRemaining.toFixed(2) : "",
      }));
      setReceipt(receiptRes.data[0] ?? null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to register payment"
      );
    } finally {
      setRegisteringPayment(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-72 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Front Desk</h1>
          <p className="text-sm text-muted-foreground">
            Create the customer, add the vehicle photo, open the wash order, and collect payment without leaving this page.
          </p>
        </div>
        <Button variant="outline" onClick={resetDeskFlow}>
          Reset Flow
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.15fr_1fr_1fr]">
        <Card className="bg-card/60 border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4 text-primary" />
              Customer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customer-search">Find existing customer</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="customer-search"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Search by name, phone or email"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="max-h-64 space-y-2 overflow-y-auto rounded-xl border border-border/60 p-2">
              {filteredCustomers.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => {
                    setSelectedCustomerId(customer.id);
                    setSelectedVehicleId("");
                    setCurrentOrder(null);
                    setReceipt(null);
                  }}
                  className={`w-full rounded-lg border px-3 py-3 text-left transition-colors ${
                    selectedCustomerId === customer.id
                      ? "border-primary bg-primary/10"
                      : "border-border/60 bg-background/40 hover:border-primary/40"
                  }`}
                >
                  <p className="text-sm font-medium">{customer.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {customer.phone}
                    {customer.email ? ` • ${customer.email}` : ""}
                  </p>
                </button>
              ))}
              {filteredCustomers.length === 0 && (
                <p className="px-2 py-6 text-sm text-muted-foreground">
                  No matching customers.
                </p>
              )}
            </div>

            <div className="rounded-xl border border-border/60 bg-background/40 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                <Plus className="h-4 w-4 text-primary" />
                Create customer
              </div>
              <form onSubmit={handleCreateCustomer} className="space-y-3">
                <Input
                  value={customerForm.name}
                  onChange={(e) =>
                    setCustomerForm((current) => ({ ...current, name: e.target.value }))
                  }
                  placeholder="Full name"
                  required
                />
                <Input
                  value={customerForm.phone}
                  onChange={(e) =>
                    setCustomerForm((current) => ({ ...current, phone: e.target.value }))
                  }
                  placeholder="Phone number"
                  required
                />
                <Input
                  type="email"
                  value={customerForm.email}
                  onChange={(e) =>
                    setCustomerForm((current) => ({ ...current, email: e.target.value }))
                  }
                  placeholder="Email address"
                />
                <Input
                  value={customerForm.notes}
                  onChange={(e) =>
                    setCustomerForm((current) => ({ ...current, notes: e.target.value }))
                  }
                  placeholder="Notes"
                />
                <Button type="submit" disabled={savingCustomer} className="w-full">
                  {savingCustomer ? "Saving..." : "Save Customer"}
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/60 border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Car className="h-4 w-4 text-primary" />
              Vehicle
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-border/60 bg-background/40 p-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {selectedCustomer ? selectedCustomer.name : "Select a customer first"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Vehicles are loaded for the selected customer only.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Existing vehicles</Label>
              <div className="max-h-52 space-y-2 overflow-y-auto rounded-xl border border-border/60 p-2">
                {vehicles.map((vehicle) => (
                  <button
                    key={vehicle.id}
                    type="button"
                    onClick={() => {
                      setSelectedVehicleId(vehicle.id);
                      setCurrentOrder(null);
                      setReceipt(null);
                    }}
                    className={`w-full rounded-lg border px-3 py-3 text-left transition-colors ${
                      selectedVehicleId === vehicle.id
                        ? "border-primary bg-primary/10"
                        : "border-border/60 bg-background/40 hover:border-primary/40"
                    }`}
                  >
                    <p className="text-sm font-medium">{vehicle.plateNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {vehicle.color} {vehicle.make} {vehicle.model}
                    </p>
                  </button>
                ))}
                {selectedCustomerId && vehicles.length === 0 && (
                  <p className="px-2 py-6 text-sm text-muted-foreground">
                    No vehicles yet for this customer.
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Open orders for this customer</Label>
              <div className="max-h-48 space-y-2 overflow-y-auto rounded-xl border border-border/60 p-2">
                {customerOrders.map((order) => (
                  <button
                    key={order.id}
                    type="button"
                    onClick={() => loadOrderIntoForm(order)}
                    className={`w-full rounded-lg border px-3 py-3 text-left transition-colors ${
                      currentOrder?.id === order.id
                        ? "border-primary bg-primary/10"
                        : "border-border/60 bg-background/40 hover:border-primary/40"
                    }`}
                  >
                    <p className="text-sm font-medium">Order #{order.id.slice(-6)}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.status} • {order.paymentStatus || "pending"} • ${Number(order.finalAmount).toFixed(2)}
                    </p>
                  </button>
                ))}
                {selectedCustomerId && customerOrders.length === 0 && (
                  <p className="px-2 py-4 text-sm text-muted-foreground">No open orders for this customer.</p>
                )}
              </div>
            </div>

            <form onSubmit={handleCreateVehicle} className="space-y-3 rounded-xl border border-border/60 bg-background/40 p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Plus className="h-4 w-4 text-primary" />
                Add vehicle with photo
              </div>
              <Input
                value={vehicleForm.plateNumber}
                onChange={(e) =>
                  setVehicleForm((current) => ({ ...current, plateNumber: e.target.value }))
                }
                placeholder="Plate number"
                required
                disabled={!selectedCustomerId}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  value={vehicleForm.make}
                  onChange={(e) =>
                    setVehicleForm((current) => ({ ...current, make: e.target.value }))
                  }
                  placeholder="Make"
                  required
                  disabled={!selectedCustomerId}
                />
                <Input
                  value={vehicleForm.model}
                  onChange={(e) =>
                    setVehicleForm((current) => ({ ...current, model: e.target.value }))
                  }
                  placeholder="Model"
                  required
                  disabled={!selectedCustomerId}
                />
                <Input
                  type="number"
                  value={vehicleForm.year}
                  onChange={(e) =>
                    setVehicleForm((current) => ({ ...current, year: e.target.value }))
                  }
                  placeholder="Year"
                  required
                  disabled={!selectedCustomerId}
                />
                <Input
                  value={vehicleForm.color}
                  onChange={(e) =>
                    setVehicleForm((current) => ({ ...current, color: e.target.value }))
                  }
                  placeholder="Color"
                  required
                  disabled={!selectedCustomerId}
                />
              </div>
              <select
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={vehicleForm.vehicleType}
                onChange={(e) =>
                  setVehicleForm((current) => ({ ...current, vehicleType: e.target.value }))
                }
                disabled={!selectedCustomerId}
              >
                <option value="sedan">Sedan</option>
                <option value="suv">SUV</option>
                <option value="pickup">Pickup</option>
                <option value="van">Van</option>
                <option value="motorcycle">Motorcycle</option>
                <option value="other">Other</option>
              </select>
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_120px]">
                <div>
                  <Input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={(e) => setVehiclePhoto(e.target.files?.[0] || null)}
                    disabled={!selectedCustomerId}
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    Upload the vehicle photo during registration.
                  </p>
                </div>
                <div className="flex h-28 items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-background/40">
                  {vehiclePhotoPreview ? (
                    <Image
                      src={vehiclePhotoPreview}
                      alt="Vehicle preview"
                      width={120}
                      height={112}
                      unoptimized
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Camera className="h-5 w-5" />
                      <span className="text-xs">No photo</span>
                    </div>
                  )}
                </div>
              </div>
              <Button type="submit" disabled={savingVehicle || !selectedCustomerId} className="w-full">
                {savingVehicle ? "Saving..." : "Save Vehicle"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-card/60 border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ClipboardList className="h-4 w-4 text-primary" />
                Order
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateOrder} className="space-y-4">
                <div className="space-y-2">
                  <Label>Location</Label>
                  <select
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={orderForm.locationId}
                    onChange={(e) =>
                      setOrderForm((current) => ({ ...current, locationId: e.target.value }))
                    }
                    required
                  >
                    <option value="">Select location</option>
                    {locations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Services</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addOrderItem}>
                      Add Service
                    </Button>
                  </div>
                  {orderForm.items.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <select
                        className="flex h-10 flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        value={item.serviceId}
                        onChange={(e) =>
                          updateOrderItem(index, { serviceId: e.target.value })
                        }
                        required
                      >
                        <option value="">Select service</option>
                        {services.map((service) => (
                          <option key={service.id} value={service.id}>
                            {service.name} - ${Number(service.basePrice).toFixed(2)}
                          </option>
                        ))}
                      </select>
                      <Input
                        type="number"
                        min={1}
                        className="w-20"
                        value={item.quantity}
                        onChange={(e) =>
                          updateOrderItem(index, {
                            quantity: Number(e.target.value) || 1,
                          })
                        }
                      />
                      {orderForm.items.length > 1 && (
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => removeOrderItem(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border border-border/60 bg-background/40 p-3 text-sm">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Selected customer</span>
                    <span>{selectedCustomer?.name || "Pending"}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-muted-foreground">
                    <span>Selected vehicle</span>
                    <span>{selectedVehicle?.plateNumber || "Pending"}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between border-t border-border pt-2 font-medium text-foreground">
                    <span>Estimated total</span>
                    <span>${draftTotal.toFixed(2)}</span>
                  </div>
                </div>

                <Input
                  value={orderForm.notes}
                  onChange={(e) =>
                    setOrderForm((current) => ({ ...current, notes: e.target.value }))
                  }
                  placeholder="Order notes"
                />

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>ITBIS</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={orderForm.taxAmount}
                      onChange={(e) =>
                        setOrderForm((current) => ({ ...current, taxAmount: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Discount</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={orderForm.discountAmount}
                      onChange={(e) =>
                        setOrderForm((current) => ({ ...current, discountAmount: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Surcharge</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={orderForm.surchargeAmount}
                      onChange={(e) =>
                        setOrderForm((current) => ({ ...current, surchargeAmount: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-border/60 bg-background/40 p-3 text-sm">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>${draftSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-muted-foreground">
                    <span>Draft total</span>
                    <span>${draftTotal.toFixed(2)}</span>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={
                    creatingOrder ||
                    !selectedCustomerId ||
                    !selectedVehicleId ||
                    !orderForm.locationId ||
                    orderForm.items.every((item) => !item.serviceId)
                  }
                  className="w-full"
                >
                  {creatingOrder ? "Saving..." : currentOrder ? "Update Order" : "Create Order"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-card/60 border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="h-4 w-4 text-primary" />
                Payment
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentOrder ? (
                <form onSubmit={handleRegisterPayment} className="space-y-4">
                  <div className="rounded-xl border border-border/60 bg-background/40 p-3 text-sm">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Order</span>
                      <span>#{currentOrder.id.slice(-6)}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-muted-foreground">
                      <span>Paid</span>
                      <span>${currentOrderPaid.toFixed(2)}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between border-t border-border pt-2 font-medium text-foreground">
                      <span>Remaining</span>
                      <span>${currentOrderRemaining.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={paymentForm.amount}
                      onChange={(e) =>
                        setPaymentForm((current) => ({ ...current, amount: e.target.value }))
                      }
                      max={currentOrderRemaining || undefined}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Fiscal Document Type</Label>
                    <select
                      className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={paymentForm.fiscalDocumentType}
                      onChange={(e) =>
                        setPaymentForm((current) => ({ ...current, fiscalDocumentType: e.target.value }))
                      }
                    >
                      <option value="B02">B02 - Consumo</option>
                      <option value="B01">B01 - Credito fiscal</option>
                      <option value="B14">B14 - Regimen especial</option>
                      <option value="B15">B15 - Gubernamental</option>
                    </select>
                    <p className="text-xs text-muted-foreground">
                      {fiscalDocumentTypeHelp[paymentForm.fiscalDocumentType]?.description}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Customer Legal Name</Label>
                    <Input
                      value={paymentForm.customerLegalName}
                      onChange={(e) =>
                        setPaymentForm((current) => ({ ...current, customerLegalName: e.target.value }))
                      }
                      placeholder="Razón social o nombre fiscal"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Customer Tax ID</Label>
                    <Input
                      value={paymentForm.customerTaxId}
                      onChange={(e) =>
                        setPaymentForm((current) => ({ ...current, customerTaxId: e.target.value }))
                      }
                      placeholder="RNC o cédula"
                    />
                    {paymentForm.customerTaxId ? (
                      <p className={`text-xs ${frontDeskTaxIdValidation.valid ? "text-emerald-400" : "text-destructive"}`}>
                        {frontDeskTaxIdValidation.valid
                          ? `${frontDeskTaxIdValidation.type} válido`
                          : "RNC o cédula inválido"}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <Label>Method</Label>
                    <select
                      className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={paymentForm.method}
                      onChange={(e) =>
                        setPaymentForm((current) => ({ ...current, method: e.target.value }))
                      }
                    >
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="transfer">Transfer</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Tip</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={paymentForm.tipAmount}
                      onChange={(e) =>
                        setPaymentForm((current) => ({ ...current, tipAmount: e.target.value }))
                      }
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Customer Email</Label>
                      <Input
                        value={paymentForm.customerEmail}
                        onChange={(e) =>
                          setPaymentForm((current) => ({ ...current, customerEmail: e.target.value }))
                        }
                        placeholder="Email opcional"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Customer Phone</Label>
                      <Input
                        value={paymentForm.customerPhone}
                        onChange={(e) =>
                          setPaymentForm((current) => ({ ...current, customerPhone: e.target.value }))
                        }
                        placeholder="Teléfono opcional"
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={registeringPayment} className="w-full">
                    {registeringPayment ? "Processing..." : currentOrderRemaining <= 0 ? "Already Paid" : "Register Payment"}
                  </Button>
                </form>
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-background/30 p-6 text-sm text-muted-foreground">
                  Create an order to enable payment.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card/60 border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ReceiptIcon className="h-4 w-4 text-primary" />
                Receipt
              </CardTitle>
            </CardHeader>
            <CardContent>
              {receipt ? (
                <div className="space-y-4 rounded-xl border border-border/60 bg-background/40 p-4">
                  <div className="text-center">
                    <CheckCircle2 className="mx-auto h-6 w-6 text-emerald-400" />
                    <p className="mt-2 text-sm font-medium">Receipt ready</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {receipt.receiptNumber}
                    </p>
                    {receipt.ncf ? <p className="text-xs text-primary font-mono">NCF: {receipt.ncf}</p> : null}
                  </div>
                  <div className="space-y-2 text-sm">
                    {receipt.items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-medium">{item.serviceName}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.quantity} x ${Number(item.unitPrice).toFixed(2)}
                          </p>
                        </div>
                        <span>${Number(item.totalPrice).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-dashed border-border pt-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span>Total</span>
                      <span className="font-semibold">
                        ${Number(receipt.totalAmount).toFixed(2)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-muted-foreground">
                      <span>Tip</span>
                      <span>${Number(receipt.tipAmount).toFixed(2)}</span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => window.open(`/receipts/${receipt.id}/print`, "_blank")}
                  >
                    <ReceiptIcon className="h-4 w-4" />
                    Print Fiscal Invoice
                  </Button>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-background/30 p-6 text-sm text-muted-foreground">
                  Register a full payment to generate and display the receipt here.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="bg-card/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-emerald-400" />
              <div>
                <p className="text-sm text-muted-foreground">Estimated ticket</p>
                <p className="text-xl font-semibold">${selectedOrderTotal.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <Car className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Vehicle</p>
                <p className="text-xl font-semibold">
                  {selectedVehicle?.plateNumber || "Pending"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <ReceiptIcon className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Receipt</p>
                <p className="text-xl font-semibold">
                  {receipt ? "Generated" : "Pending"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
