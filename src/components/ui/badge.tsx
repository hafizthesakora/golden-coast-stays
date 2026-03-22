import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        gold: "bg-[#c9a961]/15 text-[#9a7b3c] border border-[#c9a961]/30",
        success: "bg-emerald-100 text-emerald-700 border border-emerald-200",
        warning: "bg-amber-100 text-amber-700 border border-amber-200",
        danger: "bg-red-100 text-red-700 border border-red-200",
        info: "bg-blue-100 text-blue-700 border border-blue-200",
        dark: "bg-[#1a1a1a] text-white",
        outline: "border border-[#e9ecef] text-[#6c757d]",
      },
    },
    defaultVariants: {
      variant: "gold",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
