"use client"
import { List, SquaresFour } from "@phosphor-icons/react"

const CONTRACT_TYPES = ["All", "NDA", "SaaS Agreement", "Employment", "MSA", "SOW"] as const
export type ContractTypeFilter = (typeof CONTRACT_TYPES)[number]

export type SortOption = "newest" | "oldest" | "name-asc"
export type ViewMode = "list" | "grid"

interface FilterBarProps {
  search: string
  onSearch: (v: string) => void
  typeFilter: ContractTypeFilter
  onTypeFilter: (v: ContractTypeFilter) => void
  sortBy: SortOption
  onSortBy: (v: SortOption) => void
  view: ViewMode
  onView: (v: ViewMode) => void
}

export function FilterBar({
  search,
  onSearch,
  typeFilter,
  onTypeFilter,
  sortBy,
  onSortBy,
  view,
  onView,
}: FilterBarProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        marginBottom: "20px",
        flexWrap: "wrap",
      }}
    >
      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        placeholder="Search documents..."
        style={{
          width: "min(280px, 100%)",
          minWidth: "160px",
          height: "34px",
          paddingInline: "12px",
          borderRadius: "6px",
          border: "1px solid var(--border-default)",
          background: "var(--surface-elevated)",
          color: "var(--text-primary)",
          fontSize: "13px",
          outline: "none",
        }}
      />

      {/* Filter chips */}
      <div style={{ display: "flex", gap: "6px", flex: 1, flexWrap: "wrap" }}>
        {CONTRACT_TYPES.map((type) => {
          const active = typeFilter === type
          return (
            <button
              key={type}
              onClick={() => onTypeFilter(type)}
              style={{
                height: "30px",
                paddingInline: "12px",
                borderRadius: "999px",
                fontSize: "12px",
                fontWeight: 500,
                cursor: "pointer",
                border: active
                  ? "1px solid rgba(200,169,110,0.3)"
                  : "1px solid var(--border-default)",
                background: active
                  ? "rgba(200,169,110,0.12)"
                  : "transparent",
                color: active
                  ? "var(--accent-gold)"
                  : "var(--text-secondary)",
                transition: "all 100ms ease",
              }}
            >
              {type}
            </button>
          )
        })}
      </div>

      {/* Sort dropdown */}
      <select
        value={sortBy}
        onChange={(e) => onSortBy(e.target.value as SortOption)}
        style={{
          height: "34px",
          paddingInline: "10px",
          borderRadius: "6px",
          border: "1px solid var(--border-default)",
          background: "var(--surface-elevated)",
          color: "var(--text-secondary)",
          fontSize: "13px",
          cursor: "pointer",
          outline: "none",
        }}
      >
        <option value="newest">Newest first</option>
        <option value="oldest">Oldest first</option>
        <option value="name-asc">Name A–Z</option>
      </select>

      {/* View toggle */}
      <div
        style={{
          display: "flex",
          border: "1px solid var(--border-default)",
          borderRadius: "6px",
          overflow: "hidden",
        }}
      >
        {(["list", "grid"] as ViewMode[]).map((v) => {
          const active = view === v
          return (
            <button
              key={v}
              onClick={() => onView(v)}
              title={v === "list" ? "List view" : "Grid view"}
              style={{
                width: "34px",
                height: "34px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "none",
                cursor: "pointer",
                background: active ? "var(--surface-elevated)" : "transparent",
                color: active ? "var(--text-primary)" : "var(--text-muted)",
                transition: "background 100ms",
              }}
            >
              {v === "list" ? <List size={16} /> : <SquaresFour size={16} />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
