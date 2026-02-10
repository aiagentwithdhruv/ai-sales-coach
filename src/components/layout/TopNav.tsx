"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  Phone,
  Mic,
  MessageSquare,
  Swords,
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
  History,
  Contact,
} from "lucide-react";
import { useRef, useState, useEffect } from "react";

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "Core",
    items: [
      { icon: Home, label: "Home", href: "/dashboard" },
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
      { icon: Presentation, label: "Decks", href: "/dashboard/presentations" },
      { icon: FileSpreadsheet, label: "Quotes", href: "/dashboard/quotations" },
      { icon: Globe, label: "Research", href: "/dashboard/research" },
      { icon: FileText, label: "Notes", href: "/dashboard/meeting-notes" },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { icon: BookOpen, label: "Objections", href: "/dashboard/objections" },
      { icon: Brain, label: "Brain", href: "/dashboard/company-brain" },
      { icon: AlertTriangle, label: "Deal Risk", href: "/dashboard/deal-risk" },
      { icon: ShieldCheck, label: "Compliance", href: "/dashboard/compliance" },
      { icon: Store, label: "Market", href: "/dashboard/marketplace" },
    ],
  },
  {
    label: "Track",
    items: [
      { icon: BarChart3, label: "Analytics", href: "/dashboard/analytics" },
      { icon: Trophy, label: "Progress", href: "/dashboard/progress" },
      { icon: Medal, label: "Leaders", href: "/dashboard/leaderboard" },
      { icon: Database, label: "Transcripts", href: "/dashboard/transcripts" },
      { icon: UserSearch, label: "Personas", href: "/dashboard/personas" },
      { icon: History, label: "History", href: "/dashboard/history" },
    ],
  },
];

export function TopNav() {
  const pathname = usePathname();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeftFade(el.scrollLeft > 4);
    setShowRightFade(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, []);

  return (
    <div className="relative w-full bg-graphite/80 backdrop-blur-md border-b border-gunmetal/60">
      {/* Left fade */}
      {showLeftFade && (
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-graphite to-transparent z-10 pointer-events-none" />
      )}
      {/* Right fade */}
      {showRightFade && (
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-graphite to-transparent z-10 pointer-events-none" />
      )}

      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex items-center gap-0.5 px-3 py-1.5 overflow-x-auto scrollbar-none"
      >
        {navGroups.map((group, gIdx) => (
          <div key={group.label} className="flex items-center shrink-0">
            {gIdx > 0 && (
              <div className="w-px h-5 bg-gunmetal/60 mx-1.5 shrink-0" />
            )}
            {group.items.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200 whitespace-nowrap shrink-0",
                    active
                      ? "bg-neonblue/12 text-neonblue border border-neonblue/20"
                      : "text-mist hover:text-silver hover:bg-white/[0.04] border border-transparent"
                  )}
                >
                  <item.icon className={cn("h-3.5 w-3.5 shrink-0", active ? "text-neonblue" : "")} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
