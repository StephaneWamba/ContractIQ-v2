"use client"
import Link from "next/link"
import { StatusBadge, ContractTypeBadge, RiskDots } from "@/components/ui/badge"
import type { Document } from "@/hooks/use-documents"

function formatContractType(type: string): string {
  return type
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ")
    .replace("Saas", "SaaS")
    .replace("Nda", "NDA")
    .replace("Msa", "MSA")
    .replace("Sow", "SOW")
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

interface DocumentCardProps {
  doc: Document
}

export function DocumentCard({ doc }: DocumentCardProps) {
  const isReady = doc.status === "ready"
  const pageCount = doc.page_count ?? 1

  const riskDots = isReady
    ? {
        critical: 0,
        high: 1,
        medium: 3,
        low: pageCount * 2,
      }
    : null

  // Map "pending" to "processing" for StatusBadge (which only accepts processing | ready | failed)
  const badgeStatus: "processing" | "ready" | "failed" =
    doc.status === "pending" ? "processing" : doc.status === "processing" ? "processing" : doc.status === "failed" ? "failed" : "ready"

  return (
    <Link
      href={`/app/documents/${doc.id}`}
      style={{ textDecoration: "none", display: "block" }}
    >
      <div
        style={{
          background: "var(--surface-elevated)",
          borderRadius: "10px",
          border: "1px solid var(--border-subtle)",
          padding: "16px",
          minHeight: "140px",
          cursor: "pointer",
          transition: "border-color 150ms ease, box-shadow 150ms ease",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget
          el.style.borderColor = "var(--border-default)"
          el.style.boxShadow = "0 4px 16px rgba(0,0,0,0.3)"
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget
          el.style.borderColor = "var(--border-subtle)"
          el.style.boxShadow = "none"
        }}
      >
        {/* Row 1: filename */}
        <div
          style={{
            fontSize: "14px",
            fontWeight: 600,
            color: "var(--text-primary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {doc.filename}
        </div>

        {/* Row 2: badges */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          <ContractTypeBadge type={formatContractType(doc.contract_type)} />
          <StatusBadge status={badgeStatus} />
        </div>

        {/* Row 3: date + risk dots */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "auto",
          }}
        >
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            {formatDate(doc.created_at)}
          </span>
          {riskDots && (
            <RiskDots
              critical={riskDots.critical}
              high={riskDots.high}
              medium={riskDots.medium}
              low={riskDots.low}
            />
          )}
        </div>
      </div>
    </Link>
  )
}
