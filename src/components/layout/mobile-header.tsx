"use client";

import Link from "next/link";
import { useAuthStore } from "@/lib/auth/store";
import { Droplets, Menu } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { navItems, adminNavItems } from "@/lib/nav-config";
import { usePathname } from "next/navigation";

export function MobileHeader() {
  const { user, hasPermission, isSuperAdmin, clearAuth } = useAuthStore();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const items = isSuperAdmin() && pathname.startsWith("/admin")
    ? adminNavItems
    : navItems.filter((item) => hasPermission(item.resource, item.action));

  return (
    <header className="lg:hidden flex items-center justify-between h-14 px-4 border-b border-border bg-card sticky top-0 z-40">
      <Link href="/dashboard" className="flex items-center gap-2">
        <Droplets className="w-6 h-6 text-primary" />
        <span className="font-bold text-base tracking-tight">WashOS</span>
      </Link>

      <button onClick={() => setOpen(!open)} className="p-2 rounded-lg hover:bg-accent">
        <Menu className="w-5 h-5" />
      </button>

      {open && (
        <div className="absolute top-14 left-0 right-0 bg-card border-b border-border p-4 space-y-1 shadow-lg">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <div className="pt-2 border-t border-border">
            <button
              onClick={() => clearAuth()}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
