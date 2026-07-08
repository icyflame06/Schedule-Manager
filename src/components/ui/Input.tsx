import React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", label, error, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 pl-1">
            {label}
          </label>
        )}
        <input
          type={type}
          className={cn(
            "w-full px-4 py-3 rounded-xl text-sm text-slate-900 glass-input placeholder-slate-400 transition-all duration-300",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <span className="text-xs text-red-500 pl-1 mt-0.5">{error}</span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 pl-1">
            {label}
          </label>
        )}
        <textarea
          className={cn(
            "w-full px-4 py-3 rounded-xl text-sm text-slate-900 glass-input placeholder-slate-400 min-h-[100px] transition-all duration-300",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <span className="text-xs text-red-500 pl-1 mt-0.5">{error}</span>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
