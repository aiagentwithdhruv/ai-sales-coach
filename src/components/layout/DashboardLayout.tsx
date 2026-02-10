"use client";

import { useState, useEffect } from "react";
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
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("sidebar_expanded");
    if (saved === "false") setSidebarExpanded(false);
  }, []);

  const toggleSidebar = () => {
    const next = !sidebarExpanded;
    setSidebarExpanded(next);
    localStorage.setItem("sidebar_expanded", String(next));
  };

  return (
    <div className="min-h-screen bg-obsidian">
      <Sidebar
        isAdmin={isAdmin}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
        expanded={sidebarExpanded}
        onToggle={toggleSidebar}
      />
      <Header
        user={user}
        onMobileMenuToggle={() => setMobileSidebarOpen((prev) => !prev)}
        sidebarExpanded={sidebarExpanded}
        onSidebarToggle={toggleSidebar}
      />
      <main
        className={`${sidebarExpanded ? "md:ml-[220px]" : "md:ml-[72px]"} pt-16 min-h-screen transition-[margin] duration-200`}
      >
        <div className="p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}
