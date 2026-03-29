"use client"

import React from "react"
import { cn } from "@/lib/utils"

interface PillOption {
  value: string
  label: string
  icon?: React.ReactNode
}

interface PillGroupProps {
  options: PillOption[]
  value: string | null
  onChange: (value: string) => void
  className?: string
}

export function PillGroup({ options, value, onChange, className }: PillGroupProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium border cursor-pointer transition-all duration-150",
              active
                ? "border-[var(--accent-gold-ring)] text-[var(--accent-gold)] bg-[var(--accent-gold-dim)]"
                : "border-[var(--border-default)] text-[var(--text-secondary)] bg-transparent hover:bg-[var(--surface-elevated)]"
            )}
          >
            {opt.icon}
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
