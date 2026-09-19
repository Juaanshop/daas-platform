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
    default: "bg-[#191919] text-[#D1D1D1] border-[#282828]",
    success: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    warning: "bg-[#BBEB42]/15 text-[#BBEB42] border-[#BBEB42]/30",
    info: "bg-sky-500/15 text-sky-400 border-sky-500/30",
    destructive: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    outline: "bg-transparent text-[#D1D1D1] border-[#282828]",
    purple: "bg-[#BBEB42]/15 text-[#BBEB42] border-[#BBEB42]/30",
  };

  const pulseColors = {
    default: "bg-[#888888]",
    success: "bg-emerald-400",
    warning: "bg-[#BBEB42]",
    info: "bg-sky-400",
    destructive: "bg-rose-400",
    outline: "bg-white",
    purple: "bg-[#BBEB42]",
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
