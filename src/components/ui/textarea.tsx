import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-[#343a40] mb-1.5">
            {label}
          </label>
        )}
        <textarea
          className={cn(
            "w-full min-h-[120px] rounded-xl border border-[#e9ecef] bg-white px-4 py-3 text-sm text-[#1a1a1a] placeholder:text-[#6c757d] resize-y transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-[#c9a961]/40 focus:border-[#c9a961]",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error && "border-red-400 focus:ring-red-200 focus:border-red-400",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
