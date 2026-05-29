export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  tenantId: string;
  permissions: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PermissionEntry {
  id: string;
  resource: string;
  action: string;
  description?: string | null;
}

export interface RolePermissionLink {
  permission: PermissionEntry;
}

export interface RoleRecord {
  id: string;
  name: string;
  description?: string | null;
  permissions?: RolePermissionLink[];
}

export interface InvitationRecord {
  id: string;
  email: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  role?: { id: string; name: string };
  location?: { id: string; name: string } | null;
  invitedBy?: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface Customer {
  id: string;
  name: string;
  legalName?: string;
  phone: string;
  email?: string;
  taxId?: string;
  taxIdType?: string;
  notes?: string;
  vehicles?: Vehicle[];
}

export interface Vehicle {
  id: string;
  customerId: string;
  plateNumber: string;
  make: string;
  model: string;
  year: number;
  color: string;
  vehicleType: string;
  photoUrl?: string;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  basePrice: number;
  durationMinutes: number;
  isActive?: boolean;
}

export interface WashOrder {
  id: string;
  status: string;
  paymentStatus?: string;
  totalAmount: number;
  taxAmount?: number;
  discountAmount?: number;
  surchargeAmount?: number;
  finalAmount: number;
  customerId: string;
  vehicleId: string;
  locationId: string;
  items: WashOrderItem[];
  payments?: Payment[];
  notes?: string;
  createdAt: string;
  // Populated by backend include
  customer?: { id: string; name: string; phone?: string };
  vehicle?: { id: string; plateNumber: string; make: string; model: string; color: string };
  location?: { id: string; name: string };
  assignedEmployee?: { id: string; user?: { firstName: string; lastName: string } } | null;
}

export interface WashOrderItem {
  id: string;
  serviceId: string;
  serviceName?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  service?: { name: string };
}

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  method: string;
  tipAmount?: number;
  status: string;
  processedAt?: string;
  order?: { id: string; status: string; finalAmount: number };
}

export interface Receipt {
  id: string;
  receiptNumber: string;
  ncf?: string | null;
  fiscalDocumentType?: string | null;
  issuerSnapshot?: Record<string, string | null> | null;
  customerSnapshot?: Record<string, string | null> | null;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  surchargeAmount?: number;
  totalAmount: number;
  tipAmount: number;
  items: ReceiptItem[];
  issuedAt: string;
}

export interface ReceiptItem {
  serviceName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Appointment {
  id: string;
  locationId: string;
  customerId: string;
  vehicleId: string;
  scheduledAt: string;
  status: string;
  services: string[];
  durationMinutes: number;
  notes?: string;
  customer?: { id: string; name: string; phone?: string };
  vehicle?: { id: string; plateNumber: string; make: string; model: string };
  location?: { id: string; name: string };
}

export interface Employee {
  id: string;
  user: {
    id?: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string | null;
  };
  location?: { id?: string; name: string };
  jobTitle?: string;
  hourlyRate?: number;
  commissionRate?: number;
  role?: { id?: string; name: string };
  isActive: boolean;
}

export interface EmployeePerformanceSummary {
  totalOrdersAssigned: number;
  completedOrders: number;
  totalServicesDone: number;
  totalRevenueAssigned: number;
  totalRevenueFromServices: number;
}

export interface EmployeePerformanceServiceRow {
  service: string;
  count: number;
  revenue: number;
}

export interface EmployeePerformanceOrderRow {
  id: string;
  status: string;
  customer: string;
  totalAmount: number;
  createdAt: string;
}

export interface EmployeePerformanceWorkRow {
  orderId: string;
  service: string;
  quantity: number;
  totalPrice: number;
  orderStatus: string;
  createdAt: string;
}

export interface EmployeePerformance {
  employee: {
    id: string;
    name: string;
    email: string;
    jobTitle?: string | null;
    location?: { id?: string; name: string } | null;
  };
  period: {
    from: string | null;
    to: string | null;
  };
  summary: EmployeePerformanceSummary;
  serviceBreakdown: EmployeePerformanceServiceRow[];
  recentOrders: EmployeePerformanceOrderRow[];
  recentServices: EmployeePerformanceWorkRow[];
}

export interface Location {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  isActive?: boolean;
}

export interface TenantBranding {
  id: string;
  name: string;
  legalName?: string | null;
  slug: string;
  description?: string | null;
  rnc?: string | null;
  logoUrl?: string | null;
}

export interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
}

export interface MediaFile {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  downloadUrl: string;
  base64Url: string;
  entityType?: string;
  entityId?: string;
  createdAt: string;
}

export interface DashboardOverview {
  ordersToday: number;
  revenueToday: number;
  activeOrders: number;
  customersToday: number;
}
