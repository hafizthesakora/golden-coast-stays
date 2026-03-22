import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, placeholder, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-[#343a40] mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            className={cn(
              "w-full h-12 rounded-xl border border-[#e9ecef] bg-white px-4 py-3 text-sm text-[#1a1a1a] appearance-none transition-all duration-200 cursor-pointer",
              "focus:outline-none focus:ring-2 focus:ring-[#c9a961]/40 focus:border-[#c9a961]",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              error && "border-red-400",
              className
            )}
            ref={ref}
            {...props}
          >
            {placeholder && (
              <option value="">{placeholder}</option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6c757d] pointer-events-none" />
        </div>
        {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";

export { Select };
