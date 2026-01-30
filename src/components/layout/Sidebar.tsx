"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  BarChart3,
  Phone,
  Briefcase,
  BookOpen,
  Mic,
  Settings,
  Users,
  Shield,
  Cpu,
  HelpCircle,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: string;
}

const mainNavItems: NavItem[] = [
  { icon: Home, label: "Dashboard", href: "/dashboard" },
  { icon: BarChart3, label: "Analytics", href: "/dashboard/analytics" },
  { icon: Phone, label: "Calls", href: "/dashboard/calls" },
  { icon: Briefcase, label: "Deals", href: "/dashboard/deals" },
  { icon: BookOpen, label: "Playbook", href: "/dashboard/playbook" },
  { icon: Mic, label: "Practice", href: "/dashboard/practice" },
];

const adminNavItems: NavItem[] = [
  { icon: Users, label: "Users", href: "/admin/users" },
  { icon: Shield, label: "Settings", href: "/admin/settings" },
  { icon: Cpu, label: "AI Config", href: "/admin/ai-config" },
];

interface SidebarProps {
  isAdmin?: boolean;
}

export function Sidebar({ isAdmin = false }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside className="fixed left-0 top-0 z-40 h-screen w-[72px] flex flex-col bg-graphite border-r border-gunmetal">
        {/* Logo */}
        <div className="flex h-16 items-center justify-center border-b border-gunmetal">
          <Link href="/dashboard" className="flex items-center justify-center">
            <div className="h-10 w-10 rounded-lg gradient-ai flex items-center justify-center text-white font-bold text-lg">
              A
            </div>
          </Link>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 flex flex-col items-center py-4 space-y-2">
          {mainNavItems.map((item) => (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-lg transition-all duration-200",
                    isActive(item.href)
                      ? "bg-neonblue/10 text-neonblue border-l-2 border-neonblue"
                      : "text-silver hover:text-platinum hover:bg-white/5"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-graphite border-gunmetal">
                <p>{item.label}</p>
              </TooltipContent>
            </Tooltip>
          ))}

          {/* Divider */}
          {isAdmin && (
            <>
              <div className="w-8 h-px bg-gunmetal my-2" />

              {/* Admin Navigation */}
              {adminNavItems.map((item) => (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-lg transition-all duration-200",
                        isActive(item.href)
                          ? "bg-neonblue/10 text-neonblue border-l-2 border-neonblue"
                          : "text-silver hover:text-platinum hover:bg-white/5"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-graphite border-gunmetal">
                    <p>{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </>
          )}
        </nav>

        {/* Bottom Actions */}
        <div className="flex flex-col items-center py-4 space-y-2 border-t border-gunmetal">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/settings"
                className="flex h-12 w-12 items-center justify-center rounded-lg text-silver hover:text-platinum hover:bg-white/5 transition-all duration-200"
              >
                <Settings className="h-5 w-5" />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-graphite border-gunmetal">
              <p>Settings</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button className="flex h-12 w-12 items-center justify-center rounded-lg text-silver hover:text-platinum hover:bg-white/5 transition-all duration-200">
                <HelpCircle className="h-5 w-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-graphite border-gunmetal">
              <p>Help & Support</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
}
