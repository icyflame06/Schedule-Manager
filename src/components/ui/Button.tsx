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
        "inline-flex items-center justify-center font-bold rounded-full transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer",
        {
          // Primary: solid high-contrast
          "bg-[var(--primary)] hover:bg-[#e0a800] text-black border border-black shadow-sm dark:border-zinc-800":
            variant === "primary",
          // Secondary: flat muted
          "bg-slate-200/50 hover:bg-slate-200/80 text-slate-900 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 dark:text-zinc-100":
            variant === "secondary",
          // Glass: static glass container
          "glass text-slate-800 dark:text-zinc-200": variant === "glass",
          // Glass Interactive: glowing & floating glass on hover
          "glass-interactive text-slate-900 dark:text-zinc-100":
            variant === "glass-interactive",
          // Danger
          "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/20":
            variant === "danger",
          // Ghost: minimal button
          "hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300":
            variant === "ghost",
        },
        {
          "px-3 py-1.5 text-sm": size === "sm",
          "px-5 py-2.5 text-sm": size === "md",
          "px-7 py-3 text-base": size === "lg",
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
