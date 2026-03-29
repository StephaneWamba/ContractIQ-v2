"use client"

const RISK_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  critical: { bg: "rgba(239,68,68,0.15)", text: "#ef4444", label: "Critical" },
  high: { bg: "rgba(249,115,22,0.15)", text: "#f97316", label: "High" },
  medium: { bg: "rgba(234,179,8,0.15)", text: "#eab308", label: "Medium" },
  low: { bg: "rgba(34,197,94,0.15)", text: "#22c55e", label: "Low" },
}

export function RiskBadge({ level }: { level: string }) {
  const colors = RISK_COLORS[level] ?? RISK_COLORS.low
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 6px",
        borderRadius: "4px",
        fontSize: "10px",
        fontWeight: 600,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        background: colors.bg,
        color: colors.text,
        flexShrink: 0,
      }}
    >
      {colors.label}
    </span>
  )
}
