"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  Phone,
  Mic,
  MessageSquare,
  Settings,
  Users,
  Shield,
  Cpu,
  HelpCircle,
  Swords,
  History,
  PenLine,
  BookOpen,
  UserSearch,
  Trophy,
  Globe,
  FileText,
  Presentation,
  Mail,
  BarChart3,
  Brain,
  FileSpreadsheet,
  AlertTriangle,
  ShieldCheck,
  Store,
  Medal,
  Database,
  Sparkles,
  Contact,
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
    label: "Core",
    items: [
      { icon: Home, label: "Dashboard", href: "/dashboard" },
      { icon: MessageSquare, label: "Coach", href: "/dashboard/coach" },
      { icon: Mic, label: "Practice", href: "/dashboard/practice" },
      { icon: PenLine, label: "Text Practice", href: "/dashboard/text-practice" },
      { icon: Phone, label: "Calls", href: "/dashboard/calls" },
    ],
  },
  {
    label: "Tools",
    items: [
      { icon: Contact, label: "CRM", href: "/dashboard/crm" },
      { icon: Swords, label: "Tools", href: "/dashboard/tools" },
      { icon: Mail, label: "Follow-ups", href: "/dashboard/follow-ups" },
      { icon: Presentation, label: "Presentations", href: "/dashboard/presentations" },
      { icon: FileSpreadsheet, label: "Quotations", href: "/dashboard/quotations" },
      { icon: Globe, label: "Research", href: "/dashboard/research" },
      { icon: FileText, label: "Meeting Notes", href: "/dashboard/meeting-notes" },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { icon: BookOpen, label: "Objections", href: "/dashboard/objections" },
      { icon: Brain, label: "Company Brain", href: "/dashboard/company-brain" },
      { icon: AlertTriangle, label: "Deal Risk", href: "/dashboard/deal-risk" },
      { icon: ShieldCheck, label: "Compliance", href: "/dashboard/compliance" },
      { icon: Store, label: "Marketplace", href: "/dashboard/marketplace" },
    ],
  },
  {
    label: "Track",
    items: [
      { icon: BarChart3, label: "Analytics", href: "/dashboard/analytics" },
      { icon: Trophy, label: "Progress", href: "/dashboard/progress" },
      { icon: Medal, label: "Leaderboard", href: "/dashboard/leaderboard" },
      { icon: Database, label: "Transcripts", href: "/dashboard/transcripts" },
      { icon: UserSearch, label: "Personas", href: "/dashboard/personas" },
      { icon: History, label: "History", href: "/dashboard/history" },
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
}

export function Sidebar({ isAdmin = false, mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  const handleLinkClick = () => {
    // Close sidebar on mobile when a link is clicked
    if (onMobileClose) {
      onMobileClose();
    }
  };

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
          "fixed left-0 top-0 z-40 h-screen w-[72px] flex flex-col bg-graphite border-r border-gunmetal transition-transform duration-200",
          // Hidden on mobile by default, shown when mobileOpen
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-center border-b border-gunmetal">
          <Link href="/dashboard" className="flex items-center justify-center" onClick={handleLinkClick}>
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-neonblue to-electricblue flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
          </Link>
        </div>

        {/* Main Navigation - Scrollable */}
        <nav className="flex-1 flex flex-col items-center py-2 space-y-1 overflow-y-auto scrollbar-none">
          {navSections.map((section, sIdx) => (
            <div key={section.label} className="w-full flex flex-col items-center">
              {sIdx > 0 && <div className="w-8 h-px bg-gunmetal my-1.5" />}
              {section.items.map((item) => (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      onClick={handleLinkClick}
                      className={cn(
                        "sidebar-glow flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-200 my-0.5",
                        isActive(item.href)
                          ? "bg-neonblue/10 text-neonblue border-l-2 border-neonblue"
                          : "text-silver hover:text-white hover:bg-white/10"
                      )}
                    >
                      <item.icon className="h-4.5 w-4.5" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-graphite border-gunmetal text-white">
                    <p>{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          ))}

          {/* Admin Navigation */}
          {isAdmin && (
            <>
              <div className="w-8 h-px bg-gunmetal my-1.5" />
              {adminNavItems.map((item) => (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      onClick={handleLinkClick}
                      className={cn(
                        "sidebar-glow flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-200 my-0.5",
                        isActive(item.href)
                          ? "bg-neonblue/10 text-neonblue border-l-2 border-neonblue"
                          : "text-silver hover:text-white hover:bg-white/10"
                      )}
                    >
                      <item.icon className="h-4.5 w-4.5" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-graphite border-gunmetal text-white">
                    <p>{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </>
          )}
        </nav>

        {/* Bottom Actions */}
        <div className="flex flex-col items-center py-3 space-y-1 border-t border-gunmetal">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/settings"
                onClick={handleLinkClick}
                className="sidebar-glow flex h-10 w-10 items-center justify-center rounded-lg text-silver hover:text-white hover:bg-white/10 transition-all duration-200"
              >
                <Settings className="h-4.5 w-4.5" />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-graphite border-gunmetal text-white">
              <p>Settings</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button className="sidebar-glow flex h-10 w-10 items-center justify-center rounded-lg text-silver hover:text-white hover:bg-white/10 transition-all duration-200">
                <HelpCircle className="h-4.5 w-4.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-graphite border-gunmetal text-white">
              <p>Help & Support</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
}
