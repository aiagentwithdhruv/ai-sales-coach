"use client";

import { useEffect, useRef } from "react";

export function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const mouseRef = useRef({ x: -500, y: -500 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };

      // Update glow-card elements with relative mouse position
      const cards = document.querySelectorAll<HTMLElement>(".glow-card");
      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty("--card-glow-x", `${x}px`);
        card.style.setProperty("--card-glow-y", `${y}px`);
      });
    };

    const animate = () => {
      if (glowRef.current) {
        const { x, y } = mouseRef.current;
        glowRef.current.style.setProperty("--glow-x", `${x}px`);
        glowRef.current.style.setProperty("--glow-y", `${y}px`);
      }
      rafRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      ref={glowRef}
      className="cursor-glow-orb pointer-events-none fixed inset-0 z-[9999]"
      style={{
        "--glow-x": "-500px",
        "--glow-y": "-500px",
      } as React.CSSProperties}
      aria-hidden="true"
    />
  );
}
