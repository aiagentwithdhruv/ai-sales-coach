"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  Settings,
  Users,
  Shield,
  Cpu,
  HelpCircle,
  Globe,
  Mail,
  BarChart3,
  Brain,
  Sparkles,
  Contact,
  ChevronsLeft,
  ChevronsRight,
  PhoneOutgoing,
  Link2,
  Bot,
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

interface NavSection {
  label: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    label: "Pipeline",
    items: [
      { icon: Home, label: "Dashboard", href: "/dashboard" },
      { icon: Contact, label: "CRM & Leads", href: "/dashboard/crm" },
      { icon: PhoneOutgoing, label: "AI Calling", href: "/dashboard/ai-calling" },
      { icon: Bot, label: "AI Agents", href: "/dashboard/agents" },
      { icon: Mail, label: "Follow-ups", href: "/dashboard/follow-ups" },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { icon: Sparkles, label: "AI Assistant", href: "/dashboard/coach" },
      { icon: Globe, label: "Research", href: "/dashboard/research" },
      { icon: Brain, label: "Company Brain", href: "/dashboard/company-brain" },
    ],
  },
  {
    label: "Operations",
    items: [
      { icon: BarChart3, label: "Analytics", href: "/dashboard/analytics" },
      { icon: Link2, label: "Integrations", href: "/dashboard/integrations" },
    ],
  },
];

const adminNavItems: NavItem[] = [
  { icon: Users, label: "Users", href: "/admin/users" },
  { icon: Shield, label: "Settings", href: "/admin/settings" },
  { icon: Cpu, label: "AI Config", href: "/admin/ai-config" },
];

interface SidebarProps {
  isAdmin?: boolean;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  expanded?: boolean;
  onToggle?: () => void;
}

export function Sidebar({
  isAdmin = false,
  mobileOpen = false,
  onMobileClose,
  expanded = true,
  onToggle,
}: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const handleLinkClick = () => {
    if (onMobileClose) onMobileClose();
  };

  const sidebarWidth = expanded ? "w-[220px]" : "w-[72px]";

  return (
    <TooltipProvider delayDuration={0}>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen flex flex-col bg-graphite border-r border-gunmetal transition-[width] duration-200 overflow-hidden",
          sidebarWidth,
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Logo + Toggle */}
        <div className={cn("flex h-16 items-center border-b border-gunmetal", expanded ? "px-4 justify-between" : "justify-center")}>
          <Link href="/dashboard" className="flex items-center gap-3" onClick={handleLinkClick}>
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-neonblue to-electricblue flex items-center justify-center shrink-0">
              <Sparkles className="w-4.5 h-4.5 text-white" />
            </div>
            {expanded && (
              <span className="text-sm font-bold text-platinum tracking-tight">QuotaHit</span>
            )}
          </Link>
          {expanded && (
            <button
              onClick={onToggle}
              className="flex h-7 w-7 items-center justify-center rounded-md text-mist hover:text-platinum hover:bg-white/[0.06] transition-colors"
              aria-label="Collapse sidebar"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Collapse button when collapsed */}
        {!expanded && (
          <div className="flex justify-center py-2">
            <button
              onClick={onToggle}
              className="flex h-8 w-8 items-center justify-center rounded-md text-mist hover:text-platinum hover:bg-white/[0.06] transition-colors"
              aria-label="Expand sidebar"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Main Navigation */}
        <nav className="flex-1 flex flex-col py-2 overflow-y-auto scrollbar-none">
          {navSections.map((section, sIdx) => (
            <div key={section.label} className="w-full">
              {sIdx > 0 && (
                <div className={cn("bg-gunmetal/50 my-2", expanded ? "h-px mx-4" : "h-px mx-4")} />
              )}
              {expanded && (
                <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-mist/70">
                  {section.label}
                </p>
              )}
              {section.items.map((item) => {
                const active = isActive(item.href);
                const linkContent = (
                  <Link
                    href={item.href}
                    onClick={handleLinkClick}
                    className={cn(
                      "sidebar-glow flex items-center gap-3 rounded-lg transition-all duration-200 my-0.5 whitespace-nowrap",
                      expanded ? "h-9 px-3 mx-2" : "h-10 w-10 justify-center mx-auto",
                      active
                        ? "bg-neonblue/10 text-neonblue"
                        : "text-silver hover:text-white hover:bg-white/[0.06]"
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {expanded && (
                      <span className="text-[13px] font-medium truncate">{item.label}</span>
                    )}
                    {active && expanded && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-neonblue shrink-0" />
                    )}
                  </Link>
                );

                if (expanded) return <div key={item.href}>{linkContent}</div>;

                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                    <TooltipContent side="right" className="bg-graphite border-gunmetal text-white">
                      <p>{item.label}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          ))}

          {/* Admin Navigation */}
          {isAdmin && (
            <>
              <div className={cn("bg-gunmetal/50 my-2", expanded ? "h-px mx-4" : "h-px mx-4")} />
              {expanded && (
                <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-mist/70">
                  Admin
                </p>
              )}
              {adminNavItems.map((item) => {
                const active = isActive(item.href);
                const linkContent = (
                  <Link
                    href={item.href}
                    onClick={handleLinkClick}
                    className={cn(
                      "sidebar-glow flex items-center gap-3 rounded-lg transition-all duration-200 my-0.5",
                      expanded ? "h-9 px-3 mx-2" : "h-10 w-10 justify-center mx-auto",
                      active
                        ? "bg-neonblue/10 text-neonblue"
                        : "text-silver hover:text-white hover:bg-white/[0.06]"
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {expanded && (
                      <span className="text-[13px] font-medium truncate">{item.label}</span>
                    )}
                  </Link>
                );

                if (expanded) return <div key={item.href}>{linkContent}</div>;

                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                    <TooltipContent side="right" className="bg-graphite border-gunmetal text-white">
                      <p>{item.label}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </>
          )}
        </nav>

        {/* Bottom Actions */}
        <div className={cn("flex flex-col py-3 space-y-1 border-t border-gunmetal", expanded ? "px-2" : "items-center")}>
          {(() => {
            const settingsLink = (
              <Link
                href="/settings"
                onClick={handleLinkClick}
                className={cn(
                  "sidebar-glow flex items-center gap-3 rounded-lg text-silver hover:text-white hover:bg-white/[0.06] transition-all duration-200",
                  expanded ? "h-9 px-3" : "h-10 w-10 justify-center"
                )}
              >
                <Settings className="h-4 w-4 shrink-0" />
                {expanded && <span className="text-[13px] font-medium">Settings</span>}
              </Link>
            );

            const helpButton = (
              <button
                className={cn(
                  "sidebar-glow flex items-center gap-3 rounded-lg text-silver hover:text-white hover:bg-white/[0.06] transition-all duration-200",
                  expanded ? "h-9 px-3" : "h-10 w-10 justify-center"
                )}
              >
                <HelpCircle className="h-4 w-4 shrink-0" />
                {expanded && <span className="text-[13px] font-medium">Help & Support</span>}
              </button>
            );

            if (expanded) {
              return (
                <>
                  {settingsLink}
                  {helpButton}
                </>
              );
            }

            return (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>{settingsLink}</TooltipTrigger>
                  <TooltipContent side="right" className="bg-graphite border-gunmetal text-white">
                    <p>Settings</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>{helpButton}</TooltipTrigger>
                  <TooltipContent side="right" className="bg-graphite border-gunmetal text-white">
                    <p>Help & Support</p>
                  </TooltipContent>
                </Tooltip>
              </>
            );
          })()}
        </div>
      </aside>
    </TooltipProvider>
  );
}
