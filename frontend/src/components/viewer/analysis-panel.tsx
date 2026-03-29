"use client"
import { useState } from "react"
import ReactMarkdown from "react-markdown"
import { PaperPlaneTilt } from "@phosphor-icons/react"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { RiskBadge } from "@/components/viewer/risk-badge"
import { getToken } from "@/lib/auth"
import type { Clause, AnalysisData } from "@/hooks/use-document-detail"

const SUGGESTIONS = [
  "What are the termination conditions?",
  "Are there any unusual clauses?",
  "What should I negotiate?",
]

interface Message {
  role: "user" | "assistant"
  content: string
}

interface Props {
  clauses: Clause[]
  analysis: AnalysisData | null
  loading: boolean
  documentId: string
  workspaceId: string | null
  selectedClauseId: string | null
  onSelectClause: (id: string) => void
  documentStatus?: string
}

export function AnalysisPanel({
  clauses,
  analysis,
  loading,
  documentId,
  workspaceId,
  selectedClauseId,
  onSelectClause,
  documentStatus,
}: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [streaming, setStreaming] = useState(false)

  async function sendMessage(text: string) {
    if (!text.trim() || streaming) return
    setMessages((prev) => [...prev, { role: "user", content: text }])
    setInput("")
    setStreaming(true)
    try {
      const token = getToken()
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/workspaces/${workspaceId}/conversations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ document_id: documentId, message: text }),
        }
      )
      const data = await res.json()
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.response || data.message || "No response",
        },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Failed to get a response. Please try again." },
      ])
    } finally {
      setStreaming(false)
    }
  }

  return (
    <div
      style={{
        width: "360px",
        flexShrink: 0,
        borderLeft: "1px solid var(--border-subtle)",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "var(--surface-base)",
        overflow: "hidden",
      }}
    >
      <Tabs defaultValue="overview" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <TabsList
          style={{
            borderRadius: 0,
            borderBottom: "1px solid var(--border-subtle)",
            background: "var(--surface-elevated)",
            height: "40px",
            padding: "4px 8px",
            flexShrink: 0,
            justifyContent: "flex-start",
            gap: "2px",
          }}
        >
          <TabsTrigger value="overview" style={{ fontSize: "12px", padding: "4px 10px" }}>
            Overview
          </TabsTrigger>
          <TabsTrigger value="clauses" style={{ fontSize: "12px", padding: "4px 10px" }}>
            Clauses
          </TabsTrigger>
          <TabsTrigger value="ask" style={{ fontSize: "12px", padding: "4px 10px" }}>
            Ask
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent
          value="overview"
          style={{ flex: 1, overflowY: "auto", padding: "16px", margin: 0 }}
        >
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className={`h-3 ${i % 3 === 2 ? "w-2/3" : "w-full"}`} />
              ))}
            </div>
          ) : analysis ? (
            <div
              style={{
                fontSize: "13px",
                lineHeight: "1.7",
                color: "var(--text-secondary)",
              }}
              className="prose-analysis"
            >
              <ReactMarkdown>{analysis.summary}</ReactMarkdown>
            </div>
          ) : (
            <div
              style={{
                fontSize: "13px",
                color: "var(--text-muted)",
                lineHeight: "1.6",
                padding: "12px 0",
              }}
            >
              {documentStatus === "ready"
                ? "No analysis available for this document."
                : "Analysis will appear here once processing is complete."}
            </div>
          )}
        </TabsContent>

        {/* Clauses Tab */}
        <TabsContent
          value="clauses"
          style={{ flex: 1, overflowY: "auto", padding: "12px", margin: 0 }}
        >
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ padding: "14px", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
                  <Skeleton className="h-3 w-24 mb-3" />
                  <Skeleton className="h-3 w-full mb-2" />
                  <Skeleton className="h-3 w-4/5" />
                </div>
              ))}
            </div>
          ) : clauses.length === 0 ? (
            <div style={{ fontSize: "13px", color: "var(--text-muted)", padding: "12px 0" }}>
              No clauses extracted yet.
            </div>
          ) : (
            clauses.map((clause) => (
              <div
                key={clause.id}
                onClick={() => onSelectClause(clause.id)}
                style={{
                  background: "var(--surface-base)",
                  border:
                    selectedClauseId === clause.id
                      ? "1px solid var(--accent-gold)"
                      : "1px solid var(--border-subtle)",
                  borderRadius: "8px",
                  padding: "14px",
                  marginBottom: "8px",
                  cursor: "pointer",
                  scrollMarginTop: "8px",
                  transition: "border-color 0.15s",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "8px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color: "var(--text-muted)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      flex: 1,
                      minWidth: 0,
                      marginRight: "8px",
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
                    lineHeight: "1.6",
                    marginBottom: "8px",
                    margin: "0 0 8px 0",
                  }}
                >
                  &ldquo;{clause.text.substring(0, 200)}
                  {clause.text.length > 200 ? "..." : ""}&rdquo;
                </p>
                {clause.analysis && (
                  <p
                    style={{
                      fontSize: "12px",
                      color: "var(--text-primary)",
                      lineHeight: "1.6",
                      margin: 0,
                    }}
                  >
                    {clause.analysis}
                  </p>
                )}
              </div>
            ))
          )}
        </TabsContent>

        {/* Ask Tab */}
        <TabsContent
          value="ask"
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            margin: 0,
          }}
        >
          {/* Messages area */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "12px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            {messages.length === 0 ? (
              <div style={{ padding: "8px 0" }}>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "12px" }}>
                  Ask questions about this contract
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "9999px",
                        border: "1px solid var(--border-default)",
                        background: "transparent",
                        cursor: "pointer",
                        fontSize: "12px",
                        color: "var(--text-secondary)",
                        transition: "border-color 0.15s, color 0.15s",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "85%",
                      padding: "8px 12px",
                      borderRadius:
                        msg.role === "user"
                          ? "12px 12px 0 12px"
                          : "12px 12px 12px 0",
                      background:
                        msg.role === "user"
                          ? "rgba(200,169,110,0.12)"
                          : "var(--surface-elevated)",
                      fontSize: "13px",
                      lineHeight: "1.5",
                      color: "var(--text-primary)",
                    }}
                  >
                    {msg.content}
                  </div>
                </div>
              ))
            )}
            {streaming && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div
                  style={{
                    padding: "8px 12px",
                    borderRadius: "12px 12px 12px 0",
                    background: "var(--surface-elevated)",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Spinner size="sm" />
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Thinking...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input bar */}
          <div
            style={{
              padding: "10px 12px",
              borderTop: "1px solid var(--border-subtle)",
              flexShrink: 0,
            }}
          >
            <div style={{ position: "relative" }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage(input)
                  }
                }}
                placeholder="Ask about this contract..."
                style={{
                  width: "100%",
                  height: "44px",
                  paddingLeft: "12px",
                  paddingRight: "44px",
                  borderRadius: "8px",
                  border: "1px solid var(--border-subtle)",
                  background: "var(--surface-elevated)",
                  color: "var(--text-primary)",
                  fontSize: "13px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || streaming}
                style={{
                  position: "absolute",
                  right: "8px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  cursor: input.trim() && !streaming ? "pointer" : "default",
                  color: input.trim() && !streaming ? "var(--accent-gold)" : "var(--text-muted)",
                  display: "flex",
                  alignItems: "center",
                  padding: "4px",
                  transition: "color 0.15s",
                }}
              >
                <PaperPlaneTilt size={18} weight={input.trim() ? "fill" : "regular"} />
              </button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
