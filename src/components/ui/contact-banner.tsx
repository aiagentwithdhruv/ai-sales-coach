"use client";

import { Phone, Mail } from "lucide-react";

export function ContactBanner() {
  return (
    <div className="bg-onyx/80 border-b border-gunmetal/50 py-1.5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center gap-4 sm:gap-6 text-xs text-silver">
        <a
          href="tel:+919827853940"
          className="flex items-center gap-1.5 hover:text-neonblue transition-colors"
        >
          <Phone className="w-3 h-3" />
          <span className="hidden sm:inline">+91 98278 53940</span>
          <span className="sm:hidden">Call Us</span>
        </a>
        <span className="text-gunmetal">|</span>
        <a
          href="mailto:aiwithdhruv@gmail.com"
          className="flex items-center gap-1.5 hover:text-neonblue transition-colors"
        >
          <Mail className="w-3 h-3" />
          <span className="hidden sm:inline">aiwithdhruv@gmail.com</span>
          <span className="sm:hidden">Email Us</span>
        </a>
      </div>
    </div>
  );
}
