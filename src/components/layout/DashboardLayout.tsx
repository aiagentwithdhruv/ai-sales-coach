"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { TopNav } from "./TopNav";

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("sidebar_collapsed");
    if (saved === "true") setSidebarCollapsed(true);
  }, []);

  const toggleSidebar = () => {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    localStorage.setItem("sidebar_collapsed", String(next));
  };

  return (
    <div className="min-h-screen bg-obsidian">
      <Sidebar
        isAdmin={isAdmin}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
        collapsed={sidebarCollapsed}
      />
      <Header
        user={user}
        onMobileMenuToggle={() => setMobileSidebarOpen((prev) => !prev)}
        sidebarCollapsed={sidebarCollapsed}
        onSidebarToggle={toggleSidebar}
      />
      <div
        className={`${sidebarCollapsed ? "md:ml-0" : "md:ml-[72px]"} pt-16 transition-[margin] duration-200`}
      >
        <TopNav />
        <main className="min-h-screen">
          <div className="p-4 md:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
