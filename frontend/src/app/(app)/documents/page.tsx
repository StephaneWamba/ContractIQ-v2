"use client"
import { useState, useMemo } from "react"
import Link from "next/link"
import { PageHeader } from "@/components/layout/page-header"
import { Skeleton } from "@/components/ui/skeleton"
import { FilterBar } from "@/components/documents/filter-bar"
import { DocumentRow } from "@/components/documents/document-row"
import { DocumentGrid } from "@/components/documents/document-grid"
import { useWorkspace } from "@/hooks/use-workspace"
import { useDocuments } from "@/hooks/use-documents"
import type { SortOption, ViewMode, ContractTypeFilter } from "@/components/documents/filter-bar"
import type { Document } from "@/hooks/use-documents"

const TYPE_MAP: Record<string, string> = {
  NDA: "NDA",
  "SAAS_AGREEMENT": "SaaS Agreement",
  "EMPLOYMENT": "Employment",
  MSA: "MSA",
  SOW: "SOW",
}

function formatContractType(type: string): string {
  return (
    TYPE_MAP[type] ??
    type
      .split("_")
      .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
      .join(" ")
      .replace("Saas", "SaaS")
      .replace("Nda", "NDA")
      .replace("Msa", "MSA")
      .replace("Sow", "SOW")
  )
}

function sortDocs(docs: Document[], sortBy: SortOption): Document[] {
  return [...docs].sort((a, b) => {
    if (sortBy === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    if (sortBy === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    return a.filename.localeCompare(b.filename)
  })
}

function SkeletonRows() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          style={{
            height: "52px",
            borderRadius: "8px",
            padding: "0 12px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Skeleton className="w-5 h-5 rounded" />
          <Skeleton className="w-[160px] h-4 rounded" />
          <Skeleton className="w-[100px] h-5 rounded-full" />
          <Skeleton className="w-[80px] h-5 rounded-full" />
          <Skeleton className="w-[40px] h-3 rounded" />
          <Skeleton className="w-[60px] h-3 rounded" />
        </div>
      ))}
    </div>
  )
}

function EmptyFiltered({ onClear }: { onClear: () => void }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        padding: "60px 0",
      }}
    >
      <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
        No documents match your search.{" "}
        <button
          onClick={onClear}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--accent-gold)",
            fontSize: "14px",
            padding: 0,
          }}
        >
          Clear filters
        </button>
      </p>
    </div>
  )
}

export default function DocumentsPage() {
  const { workspace, loading: wsLoading } = useWorkspace()
  const { documents, loading: docsLoading, refetch } = useDocuments(workspace?.id ?? null)

  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<ContractTypeFilter>("All")
  const [sortBy, setSortBy] = useState<SortOption>("newest")
  const [view, setView] = useState<ViewMode>("list")

  const loading = wsLoading || docsLoading

  const filteredDocs = useMemo(() => {
    let result = documents

    if (typeFilter !== "All") {
      result = result.filter(
        (d) => formatContractType(d.contract_type) === typeFilter
      )
    }

    if (search.trim().length > 0) {
      const q = search.toLowerCase()
      result = result.filter((d) => d.filename.toLowerCase().includes(q))
    }

    return sortDocs(result, sortBy)
  }, [documents, typeFilter, search, sortBy])

  function clearFilters() {
    setSearch("")
    setTypeFilter("All")
  }

  const uploadButton = (
    <Link
      href="/app/documents/upload"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        height: "36px",
        paddingInline: "16px",
        borderRadius: "6px",
        background: "var(--accent-gold)",
        color: "#0C0C0E",
        fontSize: "13px",
        fontWeight: 500,
        textDecoration: "none",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18)",
      }}
    >
      Upload
    </Link>
  )

  return (
    <div>
      <PageHeader title="Documents" actions={uploadButton} />

      <FilterBar
        search={search}
        onSearch={setSearch}
        typeFilter={typeFilter}
        onTypeFilter={setTypeFilter}
        sortBy={sortBy}
        onSortBy={setSortBy}
        view={view}
        onView={setView}
      />

      {loading ? (
        <SkeletonRows />
      ) : filteredDocs.length === 0 ? (
        <EmptyFiltered onClear={clearFilters} />
      ) : view === "list" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {filteredDocs.map((doc) => (
            <DocumentRow
              key={doc.id}
              doc={doc}
              workspaceId={workspace?.id ?? ""}
              onDeleted={refetch}
            />
          ))}
        </div>
      ) : (
        <DocumentGrid documents={filteredDocs} />
      )}
    </div>
  )
}
