"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

interface DashboardLayoutProps {
  children: React.ReactNode;
  isAdmin?: boolean;
  user?: {
    name: string;
    email: string;
    avatar?: string;
    role: "sales_rep" | "manager" | "admin";
  };
}

export function DashboardLayout({
  children,
  isAdmin = false,
  user,
}: DashboardLayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-obsidian">
      <Sidebar
        isAdmin={isAdmin}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />
      <Header
        user={user}
        onMobileMenuToggle={() => setMobileSidebarOpen((prev) => !prev)}
      />
      <main className="md:ml-[72px] pt-16 min-h-screen">
        <div className="p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}
