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
      "relative inline-flex items-center justify-center font-bold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#080808] disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer";

    const variantStyles = {
      primary:
        "bg-[#BBEB42] hover:bg-[#CDF561] text-[#080808] font-black shadow-lg shadow-[#BBEB42]/15 hover:brightness-105 focus:ring-[#BBEB42] border border-[#BBEB42]/30",
      secondary:
        "bg-[#191919] hover:bg-[#282828] text-white border border-[#282828] hover:border-[#454545] shadow-sm focus:ring-[#282828]",
      outline:
        "bg-transparent hover:bg-[#191919] text-[#D1D1D1] hover:text-white border border-[#282828] hover:border-[#454545] focus:ring-[#BBEB42]",
      ghost:
        "bg-transparent hover:bg-[#191919] text-[#888888] hover:text-white focus:ring-[#282828]",
      destructive:
        "bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 focus:ring-rose-400",
      cyber:
        "bg-gradient-to-r from-[#BBEB42] to-[#CDF561] text-[#080808] font-black shadow-lg shadow-[#BBEB42]/20 hover:brightness-105 focus:ring-[#BBEB42] border border-[#E3FB9B]",
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
