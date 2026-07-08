import React from "react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export function Logo({ className, showText = true }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5 group select-none", className)}>
      {/* 
        ========================================================================
        PERSONAL LOGO SECTION
        ========================================================================
        To replace the default Palsa logo with your own personal logo:
        1. Remove the <svg> element below.
        3. Make sure to keep the wrapper or adjust classes as needed.
        ========================================================================
      */}
      <div className="relative h-20 sm:h-24 w-auto min-w-[5rem] flex items-center justify-start shrink-0 transition-transform group-hover:scale-105">
        <img
          src="/palsa%20png%20logo_200%20px.png"
          alt="Brand Logo"
          className="h-full w-auto object-contain drop-shadow-sm"
        />
      </div>
    </div>
  );
}
