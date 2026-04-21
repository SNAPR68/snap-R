import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-[rgba(211,197,174,0.15)] bg-[var(--surface-container)] px-3 py-1 text-sm text-[var(--on-surface)] shadow-sm transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[var(--on-surface)] placeholder:text-[var(--on-surface-muted)] focus-visible:outline-none focus-visible:border-[var(--gold)]/60 focus-visible:ring-2 focus-visible:ring-[var(--gold)]/25 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-40",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
