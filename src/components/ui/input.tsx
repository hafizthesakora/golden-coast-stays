import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, icon, iconPosition = "left", ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-[#343a40] mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && iconPosition === "left" && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6c757d]">
              {icon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              "w-full h-12 rounded-xl border border-[#e9ecef] bg-white px-4 py-3 text-sm text-[#1a1a1a] placeholder:text-[#6c757d] transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-[#c9a961]/40 focus:border-[#c9a961]",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              error && "border-red-400 focus:ring-red-200 focus:border-red-400",
              icon && iconPosition === "left" && "pl-11",
              icon && iconPosition === "right" && "pr-11",
              className
            )}
            ref={ref}
            {...props}
          />
          {icon && iconPosition === "right" && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6c757d]">
              {icon}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-xs text-red-500">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
