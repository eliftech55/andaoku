import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "sage" | "amber" | "outline" | "destructive" | "success";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variantStyles = {
    default: "bg-brand-700 text-white",
    secondary: "bg-sage-100 text-brand-900 border border-sage-200",
    sage: "bg-sage-50 text-sage-700 border border-sage-300",
    amber: "bg-amber-100 text-amber-800 border border-amber-300",
    success: "bg-emerald-100 text-emerald-800 border border-emerald-300",
    destructive: "bg-rose-100 text-rose-800 border border-rose-300",
    outline: "text-charcoal border border-sage-300 bg-transparent",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}
