"use client"
import { useState, useMemo } from "react"
import { Funnel } from "@phosphor-icons/react"
import { Skeleton } from "@/components/ui/skeleton"
import { RiskBadge } from "@/components/viewer/risk-badge"
import type { Clause } from "@/hooks/use-document-detail"

const RISK_ORDER = { critical: 0, high: 1, medium: 2, low: 3 }
const ALL_LEVELS = ["critical", "high", "medium", "low"] as const

const LEVEL_COLORS: Record<string, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#22c55e",
}

interface Props {
  clauses: Clause[]
  loading: boolean
  selectedId: string | null
  onSelect: (id: string) => void
}

export function ClauseSidebar({ clauses, loading, selectedId, onSelect }: Props) {
  const [showFilter, setShowFilter] = useState(false)
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set(ALL_LEVELS))

  const toggleFilter = (level: string) => {
    setActiveFilters((prev) => {
      const next = new Set(prev)
      if (next.has(level)) next.delete(level)
      else next.add(level)
      return next
    })
  }

  const sorted = useMemo(() => {
    return [...clauses]
      .filter((c) => activeFilters.has(c.risk_level))
      .sort((a, b) => (RISK_ORDER[a.risk_level] ?? 4) - (RISK_ORDER[b.risk_level] ?? 4))
  }, [clauses, activeFilters])

  return (
    <div
      style={{
        width: "240px",
        flexShrink: 0,
        borderRight: "1px solid var(--border-subtle)",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "var(--surface-base)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "12px 14px 8px",
          borderBottom: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
          Clauses
        </span>
        <button
          onClick={() => setShowFilter((v) => !v)}
          style={{
            background: showFilter ? "rgba(200,169,110,0.12)" : "transparent",
            border: "none",
            cursor: "pointer",
            padding: "4px",
            borderRadius: "4px",
            color: showFilter ? "var(--accent-gold)" : "var(--text-muted)",
            display: "flex",
            alignItems: "center",
          }}
          title="Filter by risk"
        >
          <Funnel size={16} weight={showFilter ? "fill" : "regular"} />
        </button>
      </div>

      {/* Filter Pills */}
      {showFilter && (
        <div
          style={{
            padding: "8px 14px",
            borderBottom: "1px solid var(--border-subtle)",
            display: "flex",
            gap: "6px",
            flexWrap: "wrap",
            flexShrink: 0,
          }}
        >
          {ALL_LEVELS.map((level) => (
            <button
              key={level}
              onClick={() => toggleFilter(level)}
              style={{
                padding: "3px 8px",
                borderRadius: "999px",
                fontSize: "10px",
                fontWeight: 600,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                cursor: "pointer",
                border: `1px solid ${LEVEL_COLORS[level]}`,
                background: activeFilters.has(level)
                  ? `${LEVEL_COLORS[level]}22`
                  : "transparent",
                color: activeFilters.has(level) ? LEVEL_COLORS[level] : "var(--text-muted)",
                transition: "all 0.15s",
              }}
            >
              {level}
            </button>
          ))}
        </div>
      )}

      {/* List */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
        {loading ? (
          <>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ padding: "8px 4px", marginBottom: "4px" }}>
                <Skeleton className="h-3 w-20 mb-2" />
                <Skeleton className="h-3 w-full" />
              </div>
            ))}
          </>
        ) : sorted.length === 0 ? (
          <div
            style={{
              padding: "24px 12px",
              textAlign: "center",
              fontSize: "12px",
              color: "var(--text-muted)",
            }}
          >
            No clauses found
          </div>
        ) : (
          sorted.map((clause) => (
            <div
              key={clause.id}
              onClick={() => onSelect(clause.id)}
              style={{
                padding: "8px 12px",
                cursor: "pointer",
                borderRadius: "6px",
                marginBottom: "2px",
                background: selectedId === clause.id ? "rgba(200,169,110,0.1)" : "transparent",
                boxShadow:
                  selectedId === clause.id ? "inset 2px 0 0 var(--accent-gold)" : "none",
                transition: "background 0.15s",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "4px",
                  gap: "4px",
                }}
              >
                <span
                  style={{
                    fontSize: "10px",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    color: "var(--text-muted)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  {clause.clause_type.replace(/_/g, " ")}
                </span>
                <RiskBadge level={clause.risk_level} />
              </div>
              <p
                style={{
                  fontSize: "12px",
                  color: "var(--text-secondary)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  margin: 0,
                }}
              >
                {clause.text}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
