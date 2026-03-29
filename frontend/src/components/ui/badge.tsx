import React from "react"
import { cn } from "@/lib/utils"

// ─── Risk Badge ───────────────────────────────────────────────────────────────

type RiskLevel = "critical" | "high" | "medium" | "low"

interface RiskBadgeProps {
  level: RiskLevel
  className?: string
}

const riskStyles: Record<RiskLevel, string> = {
  critical: "border-[var(--risk-critical)] text-[var(--risk-critical)] bg-[rgba(224,82,82,0.1)]",
  high:     "border-[var(--risk-high)] text-[var(--risk-high)] bg-[rgba(224,140,48,0.1)]",
  medium:   "border-[var(--accent-gold)] text-[var(--accent-gold)] bg-[var(--accent-gold-dim)]",
  low:      "border-[var(--semantic-success)] text-[var(--semantic-success)] bg-[rgba(76,175,128,0.1)]",
}

const riskLabels: Record<RiskLevel, string> = {
  critical: "Critical",
  high:     "High",
  medium:   "Medium",
  low:      "Low",
}

const criticalPulseStyle: React.CSSProperties = {
  animation: "badge-pulse 2000ms ease-in-out infinite",
}

export function RiskBadge({ level, className }: RiskBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border",
        riskStyles[level],
        className
      )}
      style={level === "critical" ? criticalPulseStyle : undefined}
    >
      {riskLabels[level]}
    </span>
  )
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

type StatusVariant = "processing" | "ready" | "failed"

interface StatusBadgeProps {
  status: StatusVariant
  className?: string
}

const statusConfig: Record<
  StatusVariant,
  { label: string; dotColor: string; pulse?: boolean }
> = {
  processing: { label: "Analyzing",  dotColor: "#E08C30", pulse: true },
  ready:      { label: "Analyzed",   dotColor: "#4CAF80", pulse: false },
  failed:     { label: "Failed",     dotColor: "#E05252", pulse: false },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { label, dotColor, pulse } = statusConfig[status]
  return (
    <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border",
          "border-[var(--border-default)] text-[var(--text-secondary)] bg-[var(--surface-elevated)]",
          className
        )}
      >
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{
            background: dotColor,
            animation: pulse ? "dot-pulse 1600ms ease-in-out infinite" : undefined,
          }}
        />
        {label}
      </span>
  )
}

// ─── Contract Type Badge ──────────────────────────────────────────────────────

interface ContractTypeBadgeProps {
  type: string
  className?: string
}

export function ContractTypeBadge({ type, className }: ContractTypeBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border",
        "border-[var(--border-default)] text-[var(--text-secondary)] bg-[var(--surface-elevated)]",
        className
      )}
    >
      {type}
    </span>
  )
}

// ─── Generic Badge ────────────────────────────────────────────────────────────

interface BadgeProps {
  children: React.ReactNode
  className?: string
}

export function Badge({ children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border",
        "border-[var(--border-default)] text-[var(--text-secondary)] bg-[var(--surface-elevated)]",
        className
      )}
    >
      {children}
    </span>
  )
}

// ─── Risk Dots ────────────────────────────────────────────────────────────────

interface RiskDotsProps {
  critical: number
  high: number
  medium: number
  low: number
  className?: string
}

export function RiskDots({ critical, high, medium, low, className }: RiskDotsProps) {
  const dots: { color: string; show: boolean; label: string; count: number }[] = [
    {
      color: "#E05252",
      show: critical > 0 || high > 0,
      label: `Critical: ${critical}, High: ${high}`,
      count: critical + high,
    },
    {
      color: "#C8A96E",
      show: medium > 0,
      label: `Medium: ${medium}`,
      count: medium,
    },
    {
      color: "#4CAF80",
      show: low > 0,
      label: `Low: ${low}`,
      count: low,
    },
  ]

  const visible = dots.filter((d) => d.show).slice(0, 3)

  if (visible.length === 0) return null

  const tooltipText = [
    critical > 0 && `Critical: ${critical}`,
    high > 0 && `High: ${high}`,
    medium > 0 && `Medium: ${medium}`,
    low > 0 && `Low: ${low}`,
  ]
    .filter(Boolean)
    .join(", ")

  return (
    <span
      className={cn("inline-flex items-center gap-1", className)}
      title={tooltipText}
    >
      {visible.map((dot, i) => (
        <span
          key={i}
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: dot.color }}
        />
      ))}
    </span>
  )
}
