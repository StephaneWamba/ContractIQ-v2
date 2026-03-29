"use client"
import { Upload, MagnifyingGlass, BookOpen, FileText } from "@phosphor-icons/react"
import Link from "next/link"
import { PageHeader } from "@/components/layout/page-header"
import { Skeleton } from "@/components/ui/skeleton"
import { useWorkspace } from "@/hooks/use-workspace"
import { useDocuments } from "@/hooks/use-documents"
import { DocumentCard } from "@/components/dashboard/document-card"
import { EmptyState } from "@/components/dashboard/empty-state"

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return "just now"
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  return `${Math.floor(diffHr / 24)}d ago`
}

const quickActions = [
  { icon: <Upload size={18} />, label: "Upload contract", href: "/app/documents/upload" },
  { icon: <MagnifyingGlass size={18} />, label: "Search portfolio", href: "/app/search" },
  { icon: <BookOpen size={18} />, label: "Edit playbook", href: "/app/playbooks" },
]

export default function DashboardPage() {
  const { workspace, me, loading: wsLoading } = useWorkspace()
  const { documents, loading: docsLoading } = useDocuments(workspace?.id ?? null)

  const loading = wsLoading || docsLoading
  const recentDocs = documents.slice(0, 4)
  const activityDocs = documents.slice(0, 8)

  if (loading) {
    return (
      <div>
        <PageHeader title="Dashboard" />

        {/* Skeleton cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[140px] rounded-[10px]" />
          ))}
        </div>

        {/* Skeleton activity rows */}
        <div style={{ display: "flex", gap: "24px" }}>
          <div
            style={{
              flex: "0 0 60%",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <Skeleton className="h-5 w-32 rounded" />
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <div>
        <PageHeader
          title="Dashboard"
          subtitle={me?.name ? `Welcome, ${me.name}` : undefined}
        />
        <EmptyState />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={me?.name ? `Welcome back, ${me.name}` : undefined}
      />

      {/* Recent documents */}
      <section style={{ marginBottom: "32px" }}>
        <h2
          style={{
            fontSize: "13px",
            fontWeight: 600,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: "12px",
          }}
        >
          Recent
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "16px",
          }}
        >
          {recentDocs.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} />
          ))}
        </div>
      </section>

      {/* Activity + Quick Actions row */}
      <div style={{ display: "flex", gap: "24px", alignItems: "flex-start" }}>
        {/* Activity feed — 60% */}
        <div style={{ flex: "0 0 60%" }}>
          <h2
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: "12px",
            }}
          >
            Activity
          </h2>
          <div
            style={{
              background: "var(--surface-elevated)",
              borderRadius: "10px",
              border: "1px solid var(--border-subtle)",
              overflow: "hidden",
            }}
          >
            {activityDocs.map((doc, idx) => (
              <Link
                key={doc.id}
                href={`/app/documents/${doc.id}`}
                style={{ textDecoration: "none" }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px 16px",
                    borderBottom:
                      idx < activityDocs.length - 1
                        ? "1px solid var(--border-subtle)"
                        : "none",
                    transition: "background 150ms ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      "rgba(255,255,255,0.04)"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent"
                  }}
                >
                  <FileText
                    size={16}
                    color="var(--text-muted)"
                    style={{ flexShrink: 0 }}
                  />
                  <span
                    style={{
                      fontSize: "14px",
                      color: "var(--text-primary)",
                      flex: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {doc.status === "ready"
                      ? `${doc.filename} analyzed`
                      : `${doc.filename} uploaded`}
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      color: "var(--text-muted)",
                      flexShrink: 0,
                    }}
                  >
                    {relativeTime(doc.created_at)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Actions — 40% */}
        <div style={{ flex: "0 0 40%" }}>
          <h2
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: "12px",
            }}
          >
            Quick Actions
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                style={{ textDecoration: "none" }}
              >
                <div
                  style={{
                    height: "72px",
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "0 20px",
                    background: "var(--surface-elevated)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "8px",
                    cursor: "pointer",
                    transition: "border-color 150ms ease",
                    color: "var(--text-primary)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-default)"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-subtle)"
                  }}
                >
                  <span style={{ color: "var(--text-muted)", flexShrink: 0 }}>
                    {action.icon}
                  </span>
                  <span style={{ fontSize: "14px", fontWeight: 500 }}>
                    {action.label}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
