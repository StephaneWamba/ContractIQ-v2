"use client"
import { useState, useEffect, use } from "react"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import { CaretLeft } from "@phosphor-icons/react"
import { getToken } from "@/lib/auth"
import { useWorkspace } from "@/hooks/use-workspace"
import { Spinner } from "@/components/ui/spinner"

const TYPE_LABELS: Record<string, string> = {
  nda: "NDA",
  "saas-agreement": "SaaS Agreement",
  employment: "Employment",
  msa: "MSA",
  sow: "SOW",
}

const DEFAULT_CONTENT: Record<string, string> = {
  nda: `# NDA Review Guidelines\n\n## Key Clauses to Check\n\n- **Definition of Confidential Information** — ensure it is clearly scoped\n- **Obligations of Receiving Party** — look for reasonable care standard\n- **Exclusions** — standard carve-outs (public domain, prior knowledge)\n- **Term** — typically 2–5 years\n- **Return/Destruction** — confirm obligations on termination\n\n## Red Flags\n\n- Unilateral vs mutual disclosure — note which party bears burden\n- Overly broad definition of confidential information\n- No residuals clause\n`,
  "saas-agreement": `# SaaS Agreement Review Guidelines\n\n## Key Clauses to Check\n\n- **SLA and Uptime** — acceptable thresholds and remedies\n- **Data Ownership** — who owns customer data\n- **Security Obligations** — encryption, access controls\n- **Termination for Convenience** — notice periods\n- **IP Assignment** — work product ownership\n\n## Red Flags\n\n- Vendor right to use customer data for ML training\n- Unilateral price increase provisions\n- Automatic renewal without notice\n`,
  employment: `# Employment Contract Review Guidelines\n\n## Key Clauses to Check\n\n- **Compensation and Benefits** — base, bonus, equity\n- **At-Will vs For Cause** — termination provisions\n- **Non-Compete** — enforceability in jurisdiction\n- **IP Assignment** — inventions assigned to employer\n- **Arbitration Clause** — waiver of jury trial\n\n## Red Flags\n\n- Overly broad non-compete scope or duration\n- No severance provisions\n- Garden leave clauses\n`,
  msa: `# MSA Review Guidelines\n\n## Key Clauses to Check\n\n- **Liability Cap** — typically limited to fees paid\n- **Indemnification** — scope and carve-outs\n- **Governing Law** — jurisdiction and venue\n- **Change of Control** — assignment rights\n- **Statement of Work** — incorporation and priority\n\n## Red Flags\n\n- Uncapped liability exposure\n- Mutual indemnification with asymmetric scope\n- Automatic renewal terms\n`,
  sow: `# SOW Review Guidelines\n\n## Key Clauses to Check\n\n- **Scope of Work** — clearly defined deliverables\n- **Acceptance Criteria** — how deliverables are accepted\n- **Payment Schedule** — milestones and timing\n- **Change Order Process** — how changes are requested\n- **IP Ownership** — work product rights\n\n## Red Flags\n\n- Vague deliverable descriptions\n- No rejection/rework provisions\n- Unclear acceptance timeline\n`,
}

export default function PlaybookEditorPage({
  params,
}: {
  params: Promise<{ type: string }>
}) {
  const { type } = use(params)
  const { workspace } = useWorkspace()

  const [content, setContent] = useState("")
  const [initialContent, setInitialContent] = useState("")
  const [preview, setPreview] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [resetConfirm, setResetConfirm] = useState(false)

  const isDirty = content !== initialContent
  const label = TYPE_LABELS[type] ?? type

  // Load existing playbook
  useEffect(() => {
    if (!workspace?.id) return
    const token = getToken()
    const apiUrl = process.env.NEXT_PUBLIC_API_URL

    fetch(`${apiUrl}/workspaces/${workspace.id}/playbooks/${type}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error("not found")
        return r.json()
      })
      .then((data: { content: string }) => {
        setContent(data.content)
        setInitialContent(data.content)
        setPreview(data.content)
      })
      .catch(() => {
        const defaultContent = DEFAULT_CONTENT[type] ?? ""
        setContent(defaultContent)
        setInitialContent(defaultContent)
        setPreview(defaultContent)
      })
      .finally(() => setLoading(false))
  }, [workspace?.id, type])

  // Debounced preview update (300ms)
  useEffect(() => {
    const t = setTimeout(() => setPreview(content), 300)
    return () => clearTimeout(t)
  }, [content])

  async function handleSave() {
    if (!workspace || saving) return
    setSaving(true)
    setSaveError(null)
    try {
      const token = getToken()
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/workspaces/${workspace.id}/playbooks/${type}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content }),
        }
      )
      if (!res.ok) throw new Error("Save failed")
      setInitialContent(content)
    } catch {
      setSaveError("Couldn't save — retrying...")
    } finally {
      setSaving(false)
    }
  }

  // Autosave 2s after change, only if dirty
  useEffect(() => {
    if (!isDirty || saving) return
    const t = setTimeout(handleSave, 2000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content])

  // Auto-cancel reset confirm after 3s
  useEffect(() => {
    if (!resetConfirm) return
    const t = setTimeout(() => setResetConfirm(false), 3000)
    return () => clearTimeout(t)
  }, [resetConfirm])

  const handleReset = () => {
    const def = DEFAULT_CONTENT[type] ?? ""
    setContent(def)
    setResetConfirm(false)
  }

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
        }}
      >
        <Spinner />
      </div>
    )
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 80px)",
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "12px",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Link
            href="/app/playbooks"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
              color: "var(--text-muted)",
              textDecoration: "none",
            }}
          >
            <CaretLeft size={14} />
            Playbooks
          </Link>
          <span
            style={{
              width: "1px",
              height: "16px",
              background: "var(--border-default)",
              display: "inline-block",
            }}
          />
          <h1
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "18px",
              fontWeight: 500,
              color: "var(--text-primary)",
              margin: 0,
            }}
          >
            {label} Playbook
          </h1>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {resetConfirm ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                Replace with default?
              </span>
              <button
                onClick={handleReset}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  border: "1px solid rgba(224,82,82,0.4)",
                  background: "transparent",
                  color: "rgb(224,82,82)",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Confirm
              </button>
              <button
                onClick={() => setResetConfirm(false)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  border: "1px solid var(--border-default)",
                  background: "transparent",
                  color: "var(--text-secondary)",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setResetConfirm(true)}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                border: "1px solid var(--border-default)",
                background: "transparent",
                color: "var(--text-secondary)",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              Reset to default
            </button>
          )}

          <button
            onClick={handleSave}
            disabled={saving || !isDirty}
            style={{
              padding: "6px 16px",
              borderRadius: "6px",
              border: isDirty
                ? "1px solid rgba(200,169,110,0.6)"
                : "1px solid var(--border-default)",
              background: isDirty ? "rgba(200,169,110,0.12)" : "transparent",
              color: isDirty ? "rgb(200,169,110)" : "var(--text-muted)",
              fontSize: "13px",
              cursor: saving || !isDirty ? "not-allowed" : "pointer",
              transition: "all 0.15s",
            }}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {/* Save error */}
      {saveError && (
        <div
          style={{
            fontSize: "12px",
            color: "var(--semantic-error)",
            marginBottom: "8px",
            flexShrink: 0,
          }}
        >
          {saveError}
        </div>
      )}

      {/* Split editor */}
      <div
        style={{
          display: "flex",
          height: "calc(100vh - 120px)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "10px",
          overflow: "hidden",
          flex: 1,
        }}
      >
        {/* Left: editor */}
        <div style={{ flex: 1, overflow: "hidden" }}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={{
              width: "100%",
              height: "100%",
              resize: "none",
              border: "none",
              outline: "none",
              background: "var(--surface-base)",
              color: "var(--text-primary)",
              fontFamily: "var(--font-mono)",
              fontSize: "13px",
              lineHeight: "1.7",
              padding: "20px",
            }}
            spellCheck={false}
          />
        </div>

        {/* Divider */}
        <div
          style={{
            width: "1px",
            background: "var(--border-subtle)",
            flexShrink: 0,
          }}
        />

        {/* Right: preview */}
        <div style={{ flex: 1, overflow: "auto" }}>
          <div
            className="playbook-preview"
            style={{
              padding: "20px",
              fontSize: "14px",
              lineHeight: "1.7",
              color: "var(--text-secondary)",
              overflowY: "auto",
              height: "100%",
            }}
          >
            <ReactMarkdown>
              {preview || "*Start typing to see preview...*"}
            </ReactMarkdown>
          </div>
        </div>
      </div>

      <style>{`
        .playbook-preview h1,
        .playbook-preview h2,
        .playbook-preview h3 {
          color: var(--text-primary);
          margin-top: 1.2em;
          margin-bottom: 0.4em;
        }
        .playbook-preview h1 { font-size: 1.4em; }
        .playbook-preview h2 { font-size: 1.2em; }
        .playbook-preview h3 { font-size: 1.05em; }
        .playbook-preview ul,
        .playbook-preview ol {
          padding-left: 1.5em;
          margin: 0.6em 0;
        }
        .playbook-preview li {
          margin-bottom: 0.3em;
        }
        .playbook-preview p {
          margin: 0.6em 0;
        }
        .playbook-preview strong {
          color: var(--text-primary);
        }
      `}</style>
    </div>
  )
}
