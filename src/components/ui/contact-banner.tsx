"use client";

import { Phone, Mail } from "lucide-react";

export function ContactBanner() {
  return (
    <div className="bg-onyx border-b border-gunmetal/60 py-2">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center gap-5 sm:gap-8 text-sm">
        <a
          href="tel:+919827853940"
          className="flex items-center gap-2 text-platinum hover:text-neonblue transition-colors"
        >
          <Phone className="w-3.5 h-3.5 text-neonblue" />
          <span className="hidden sm:inline font-medium">+91 98278 53940</span>
          <span className="sm:hidden font-medium">Call Us</span>
        </a>
        <span className="text-gunmetal">|</span>
        <a
          href="mailto:aiwithdhruv@gmail.com"
          className="flex items-center gap-2 text-platinum hover:text-neonblue transition-colors"
        >
          <Mail className="w-3.5 h-3.5 text-neonblue" />
          <span className="hidden sm:inline font-medium">aiwithdhruv@gmail.com</span>
          <span className="sm:hidden font-medium">Email Us</span>
        </a>
      </div>
    </div>
  );
}
