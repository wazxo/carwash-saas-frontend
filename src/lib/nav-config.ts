import {
  LayoutDashboard,
  Users,
  Car,
  Wrench,
  ClipboardList,
  CreditCard,
  Receipt,
  Calendar,
  UserCog,
  MapPin,
  Settings,
  Shield,
  HelpCircle,
  FileImage,
  Clock,
  ShoppingCart,
  Wallet,
  BarChart3,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  resource: string;
  action: string;
  mobile?: boolean;
}

export const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, resource: "dashboard", action: "read", mobile: true },
  { label: "Front Desk", href: "/front-desk", icon: ShoppingCart, resource: "wash_orders", action: "create", mobile: true },
  { label: "Queue", href: "/queue", icon: Clock, resource: "wash_orders", action: "read", mobile: true },
  { label: "Customers", href: "/customers", icon: Users, resource: "customers", action: "read", mobile: true },
  { label: "Vehicles", href: "/vehicles", icon: Car, resource: "vehicles", action: "read", mobile: false },
  { label: "Services", href: "/services", icon: Wrench, resource: "services", action: "read", mobile: false },
  { label: "Orders", href: "/orders", icon: ClipboardList, resource: "wash_orders", action: "read", mobile: true },
  { label: "Payments", href: "/payments", icon: CreditCard, resource: "payments", action: "read", mobile: false },
  { label: "Receipts", href: "/receipts", icon: Receipt, resource: "receipts", action: "read", mobile: false },
  { label: "Appointments", href: "/appointments", icon: Calendar, resource: "appointments", action: "read", mobile: false },
  { label: "Employees", href: "/employees", icon: UserCog, resource: "employees", action: "read", mobile: false },
  { label: "Locations", href: "/locations", icon: MapPin, resource: "locations", action: "read", mobile: false },
  { label: "Files", href: "/files", icon: FileImage, resource: "media", action: "read", mobile: false },
  { label: "Reports", href: "/reports", icon: BarChart3, resource: "reports", action: "read", mobile: false },
  { label: "Support", href: "/support", icon: HelpCircle, resource: "support_tickets", action: "read", mobile: false },
  { label: "Billing", href: "/settings/billing", icon: Wallet, resource: "tenants", action: "read", mobile: false },
  { label: "Settings", href: "/settings/tenant", icon: Settings, resource: "tenants", action: "read", mobile: false },
];

export const adminNavItems: NavItem[] = [
  { label: "Stats", href: "/admin", icon: LayoutDashboard, resource: "*", action: "*" },
  { label: "Tenants", href: "/admin/tenants", icon: Shield, resource: "*", action: "*" },
  { label: "Audit Logs", href: "/admin/audit-logs", icon: ClipboardList, resource: "*", action: "*" },
  { label: "Support Tickets", href: "/admin/support-tickets", icon: HelpCircle, resource: "*", action: "*" },
];
