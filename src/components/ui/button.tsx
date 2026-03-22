import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        gold:
          "bg-gradient-to-r from-[#c9a961] via-[#e8d5a3] to-[#c9a961] text-[#1a1a1a] font-semibold shadow-[0_5px_20px_rgba(201,169,97,0.4)] hover:shadow-[0_8px_30px_rgba(201,169,97,0.6)] hover:scale-[1.03] active:scale-[0.98]",
        "gold-outline":
          "border-2 border-[#c9a961] text-[#c9a961] bg-transparent hover:bg-[#c9a961] hover:text-white font-semibold",
        dark: "bg-[#1a1a1a] text-white hover:bg-[#343a40] shadow-lg hover:shadow-xl",
        "dark-outline":
          "border-2 border-[#1a1a1a] text-[#1a1a1a] bg-transparent hover:bg-[#1a1a1a] hover:text-white font-semibold",
        white:
          "bg-white text-[#1a1a1a] shadow-md hover:shadow-lg hover:bg-[#f8f9fa]",
        ghost: "text-[#6c757d] hover:text-[#1a1a1a] hover:bg-[#f8f9fa]",
        danger: "bg-red-500 text-white hover:bg-red-600 shadow-md",
      },
      size: {
        sm: "h-9 px-4 text-xs",
        md: "h-11 px-6 text-sm",
        lg: "h-13 px-8 text-base",
        xl: "h-14 px-10 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "gold",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
