"use client"
import Link from "next/link"
import { PageHeader } from "@/components/layout/page-header"

const PLAYBOOK_TYPES = [
  { type: "nda", label: "NDA" },
  { type: "saas-agreement", label: "SaaS Agreement" },
  { type: "employment", label: "Employment" },
  { type: "msa", label: "MSA" },
  { type: "sow", label: "SOW" },
]

export default function PlaybooksPage() {
  return (
    <div>
      <PageHeader
        title="Playbooks"
        subtitle="Your review guidelines for each contract type."
      />

      <div>
        {PLAYBOOK_TYPES.map(({ type, label }, idx) => (
          <div
            key={type}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "16px 0",
              borderBottom:
                idx < PLAYBOOK_TYPES.length - 1
                  ? "1px solid var(--border-subtle)"
                  : "none",
            }}
          >
            <span
              style={{
                fontSize: "15px",
                color: "var(--text-primary)",
              }}
            >
              {label}
            </span>
            <Link
              href={`/app/playbooks/${type}`}
              style={{
                fontSize: "13px",
                color: "var(--accent-gold)",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLAnchorElement).style.textDecoration =
                  "underline"
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLAnchorElement).style.textDecoration =
                  "none"
              }}
            >
              Edit →
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
