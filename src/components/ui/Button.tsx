import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "glass" | "glass-interactive" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-bold rounded-xl transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer",
        {
          // Primary: solid high-contrast brand color
          "bg-[var(--primary)] hover:bg-[#EAA800] text-[#111111] shadow-[0_4px_14px_0_rgba(251,186,0,0.39)] hover:shadow-[0_6px_20px_rgba(251,186,0,0.23)] hover:-translate-y-0.5":
            variant === "primary",
          // Secondary: flat white with subtle border
          "bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 shadow-sm hover:shadow":
            variant === "secondary",
          // Glass: static glass container
          "glass text-slate-800": variant === "glass",
          // Glass Interactive: glowing & floating glass on hover
          "glass-interactive text-slate-900":
            variant === "glass-interactive",
          // Danger
          "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/20":
            variant === "danger",
          // Ghost: minimal button
          "hover:bg-slate-100 text-slate-700":
            variant === "ghost",
        },
        {
          "px-4 py-2 text-sm": size === "sm",
          "px-6 py-3 text-sm": size === "md",
          "px-8 py-4 text-base": size === "lg",
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
