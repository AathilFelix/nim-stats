"use client";

import { useReveal } from "@/lib/hooks/use-reveal";
import { cn } from "@/lib/utils";

export function RevealSection({ children, className }: { children: React.ReactNode; className?: string }) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-500",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
        className,
      )}
    >
      {children}
    </div>
  );
}
