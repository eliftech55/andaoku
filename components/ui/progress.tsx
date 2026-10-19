import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  color?: "brand" | "amber" | "emerald";
}

export function Progress({ value, color = "brand", className, ...props }: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value || 0));

  const barColor = {
    brand: "bg-brand-700",
    amber: "bg-amber-500",
    emerald: "bg-emerald-600",
  }[color];

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("relative h-2.5 w-full overflow-hidden rounded-full bg-sage-200/60", className)}
      {...props}
    >
      <div
        className={cn("h-full transition-all duration-500 ease-out rounded-full", barColor)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
