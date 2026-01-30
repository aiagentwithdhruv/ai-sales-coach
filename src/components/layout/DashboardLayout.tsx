"use client";

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
  return (
    <div className="min-h-screen bg-obsidian">
      <Sidebar isAdmin={isAdmin} />
      <Header user={user} />
      <main className="ml-[72px] pt-16 min-h-screen">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
