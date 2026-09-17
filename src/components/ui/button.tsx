"use client";

import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  children?: React.ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive" | "cyber";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "relative inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer";

    const variantStyles = {
      primary:
        "bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:brightness-105 focus:ring-emerald-400 border border-emerald-400/30",
      secondary:
        "bg-slate-900/80 hover:bg-slate-800 text-slate-100 border border-white/10 hover:border-white/20 shadow-sm focus:ring-slate-400",
      outline:
        "bg-transparent hover:bg-white/5 text-slate-200 border border-white/15 hover:border-white/30 focus:ring-emerald-400",
      ghost:
        "bg-transparent hover:bg-white/5 text-slate-300 hover:text-white focus:ring-slate-400",
      destructive:
        "bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 focus:ring-rose-400",
      cyber:
        "bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/35 hover:brightness-110 focus:ring-cyan-400 border border-cyan-300/30",
    };

    const sizeStyles = {
      sm: "text-xs px-3 py-1.5 gap-1.5",
      md: "text-sm px-4 py-2.5 gap-2",
      lg: "text-base px-6 py-3.5 gap-2.5 font-semibold",
      icon: "w-9 h-9 p-0 flex items-center justify-center",
    };

    return (
      <motion.button
        ref={ref}
        whileTap={disabled || isLoading ? undefined : { scale: 0.98 }}
        whileHover={disabled || isLoading ? undefined : { scale: 1.01 }}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin text-current" />}
        {children}
      </motion.button>
    );
  }
);

Button.displayName = "Button";
