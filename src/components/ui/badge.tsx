import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "info" | "destructive" | "outline" | "purple";
  pulse?: boolean;
}

export function Badge({
  className,
  variant = "default",
  pulse = false,
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: "bg-slate-800/80 text-slate-300 border-slate-700/60",
    success: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    warning: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    info: "bg-sky-500/15 text-sky-300 border-sky-500/30",
    destructive: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    outline: "bg-transparent text-slate-300 border-white/20",
    purple: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
  };

  const pulseColors = {
    default: "bg-slate-400",
    success: "bg-emerald-400",
    warning: "bg-amber-400",
    info: "bg-sky-400",
    destructive: "bg-rose-400",
    outline: "bg-white",
    purple: "bg-indigo-400",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide border shadow-xs select-none",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span
            className={cn(
              "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
              pulseColors[variant]
            )}
          />
          <span
            className={cn(
              "relative inline-flex rounded-full h-2 w-2",
              pulseColors[variant]
            )}
          />
        </span>
      )}
      {children}
    </span>
  );
}
