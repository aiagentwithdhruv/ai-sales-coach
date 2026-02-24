"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ChevronDown, UserSearch, MessageSquare, Mail, Phone, Swords, ArrowRight } from "lucide-react";

const products = [
  {
    icon: UserSearch,
    title: "Scout + Researcher",
    desc: "AI finds and enriches leads 24/7",
    color: "text-neonblue",
    bg: "bg-neonblue/10",
  },
  {
    icon: MessageSquare,
    title: "Qualifier Agent",
    desc: "BANT+ conversations, zero human needed",
    color: "text-automationgreen",
    bg: "bg-automationgreen/10",
  },
  {
    icon: Mail,
    title: "Outreach Agent",
    desc: "Email, LinkedIn, WhatsApp, cold calling",
    color: "text-warningamber",
    bg: "bg-warningamber/10",
  },
  {
    icon: Swords,
    title: "Closer Agent",
    desc: "Negotiates, sends proposals, collects payment",
    color: "text-neonblue",
    bg: "bg-neonblue/10",
  },
];

export function NavProductDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleLeave = () => {
    timeoutRef.current = setTimeout(() => setIsOpen(false), 200);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div
      className="relative"
      ref={dropdownRef}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <button
        className="flex items-center gap-1 text-silver hover:text-platinum transition-colors cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        AI Agents
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="nav-dropdown absolute top-full left-1/2 -translate-x-1/2 mt-3 w-72 rounded-xl border border-neonblue/20 bg-onyx/95 backdrop-blur-xl shadow-2xl shadow-neonblue/10 p-2 z-50">
          {/* Glow top accent */}
          <div className="absolute -top-px left-4 right-4 h-px bg-gradient-to-r from-transparent via-neonblue/50 to-transparent" />

          <div className="space-y-1">
            {products.map((product) => (
              <Link
                key={product.title}
                href="/features"
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/5 transition-all duration-200 group"
                onClick={() => setIsOpen(false)}
              >
                <div
                  className={`w-9 h-9 rounded-lg ${product.bg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}
                >
                  <product.icon className={`h-4 w-4 ${product.color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-platinum group-hover:text-white">
                    {product.title}
                  </p>
                  <p className="text-xs text-mist group-hover:text-silver transition-colors">
                    {product.desc}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          <div className="border-t border-gunmetal mt-2 pt-2">
            <Link
              href="/features"
              className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5 transition-colors group"
              onClick={() => setIsOpen(false)}
            >
              <span className="text-xs font-medium text-neonblue">
                See All 7 Agents
              </span>
              <ArrowRight className="h-3 w-3 text-neonblue group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
