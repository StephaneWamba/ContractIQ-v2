"use client"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { MagnifyingGlass, ArrowSquareOut, Sparkle } from "@phosphor-icons/react"
import { PageHeader } from "@/components/layout/page-header"
import { getToken } from "@/lib/auth"
import { useWorkspace } from "@/hooks/use-workspace"
import { Spinner } from "@/components/ui/spinner"

interface FuzzyResult {
  path: string
  line: number
  text: string
  score: number
}

interface SemanticResult {
  document_id: string
  page: number
  text: string
  score: number
}

type SearchResult = FuzzyResult | SemanticResult

function isSemantic(r: SearchResult): r is SemanticResult {
  return "document_id" in r
}

function extractFilenameFromPath(path: string): string {
  return path.split("/").pop() ?? path
}

function highlightMatch(text: string, query: string): string {
  if (!query.trim()) return text
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  try {
    const re = new RegExp(`(${escaped})`, "gi")
    return text.replace(
      re,
      '<mark style="background:rgba(200,169,110,0.25);color:inherit">$1</mark>'
    )
  } catch {
    return text
  }
}

const MODES = [
  { value: "fuzzy", label: "Fuzzy" },
  { value: "exact", label: "Exact" },
  { value: "regex", label: "Regex" },
  { value: "semantic", label: "Semantic", icon: <Sparkle size={12} /> },
] as const

type Mode = (typeof MODES)[number]["value"]

const MODE_DESCRIPTIONS: Record<Mode, string> = {
  fuzzy: "Find approximate matches across all contracts",
  exact: "Find exact text matches",
  regex: "Use regular expressions for advanced matching",
  semantic: "Find clauses by meaning, not just keywords — powered by AI",
}

const RECENT_SEARCHES_KEY = "ciq_recent_searches"
const MAX_RECENT = 5

function getRecentSearches(): string[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) ?? "[]")
  } catch {
    return []
  }
}

function saveRecentSearch(q: string) {
  const recent = getRecentSearches().filter((r) => r !== q)
  const updated = [q, ...recent].slice(0, MAX_RECENT)
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
}

export default function SearchPage() {
  const router = useRouter()
  const { workspace } = useWorkspace()
  const searchInputRef = useRef<HTMLInputElement>(null)

  const [query, setQuery] = useState("")
  const [mode, setMode] = useState<Mode>("fuzzy")
  const [focused, setFocused] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  useEffect(() => {
    setRecentSearches(getRecentSearches())
  }, [])

  // Global Cmd+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  const handleSearch = async () => {
    if (!query.trim() || !workspace?.id) return
    setSearching(true)
    setHasSearched(true)
    saveRecentSearch(query.trim())
    setRecentSearches(getRecentSearches())

    const token = getToken()
    const apiUrl = process.env.NEXT_PUBLIC_API_URL

    try {
      const res = await fetch(
        `${apiUrl}/workspaces/${workspace.id}/search?q=${encodeURIComponent(query)}&mode=${mode}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (!res.ok) throw new Error("Search failed")
      const data = await res.json()
      setResults(data.results ?? [])
    } catch {
      setResults([])
    } finally {
      setSearching(false)
    }
  }

  const runRecentSearch = (q: string) => {
    setQuery(q)
    setTimeout(() => handleSearch(), 0)
  }

  return (
    <div>
      <PageHeader title="Search" subtitle="Search across your contract portfolio." />

      {/* Search bar */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
          marginBottom: "32px",
        }}
      >
        <div style={{ position: "relative", width: "100%", maxWidth: "600px" }}>
          <MagnifyingGlass
            size={18}
            color="var(--text-muted)"
            style={{
              position: "absolute",
              left: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
            }}
          />
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Search across all contracts..."
            style={{
              width: "100%",
              height: "52px",
              borderRadius: "10px",
              border: focused
                ? "1px solid rgba(200,169,110,0.6)"
                : "1px solid var(--border-default)",
              background: "var(--surface-elevated)",
              padding: "0 16px 0 44px",
              fontSize: "16px",
              color: "var(--text-primary)",
              boxShadow: focused ? "0 0 0 3px rgba(200,169,110,0.12)" : "none",
              transition: "border-color 0.15s, box-shadow 0.15s",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Mode selector */}
        <div style={{ display: "flex", gap: "8px" }}>
          {MODES.map((m) => (
            <button
              key={m.value}
              onClick={() => setMode(m.value)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "5px 12px",
                borderRadius: "20px",
                border:
                  mode === m.value
                    ? "1px solid rgba(200,169,110,0.5)"
                    : "1px solid var(--border-default)",
                background:
                  mode === m.value ? "rgba(200,169,110,0.1)" : "transparent",
                color:
                  mode === m.value
                    ? "rgb(200,169,110)"
                    : "var(--text-secondary)",
                fontSize: "13px",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {"icon" in m && m.icon}
              {m.label}
            </button>
          ))}
        </div>

        <p
          style={{
            fontSize: "12px",
            color: "var(--text-muted)",
            textAlign: "center",
          }}
        >
          {MODE_DESCRIPTIONS[mode]}
        </p>
      </div>

      {/* Recent searches */}
      {!hasSearched && recentSearches.length > 0 && !query && (
        <div style={{ marginBottom: "24px" }}>
          <p
            style={{
              fontSize: "11px",
              fontWeight: 600,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: "10px",
            }}
          >
            Recent
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {recentSearches.map((r) => (
              <button
                key={r}
                onClick={() => runRecentSearch(r)}
                style={{
                  padding: "4px 12px",
                  borderRadius: "20px",
                  border: "1px solid var(--border-default)",
                  background: "transparent",
                  color: "var(--text-secondary)",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {searching && (
        <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
          <Spinner />
        </div>
      )}

      {!searching && hasSearched && results.length === 0 && (
        <p style={{ fontSize: "14px", color: "var(--text-muted)", textAlign: "center", padding: "40px" }}>
          No results found.
        </p>
      )}

      {!searching && results.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {results.map((r, idx) => (
            <div
              key={idx}
              style={{
                background: "var(--surface-elevated)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "10px",
                padding: "16px",
              }}
            >
              {isSemantic(r) ? (
                <>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "6px",
                    }}
                  >
                    <span
                      style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}
                    >
                      Document {r.document_id}
                    </span>
                    <ArrowSquareOut
                      size={14}
                      style={{ cursor: "pointer", color: "var(--text-muted)" }}
                      onClick={() => router.push(`/app/documents/${r.document_id}`)}
                    />
                  </div>
                  <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "8px" }}>
                    Page {r.page}
                  </p>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "var(--text-secondary)",
                      marginBottom: "10px",
                    }}
                  >
                    {r.text}
                  </p>
                  {/* Similarity bar */}
                  <div
                    style={{
                      height: "3px",
                      background: "var(--border-subtle)",
                      borderRadius: "2px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${r.score * 100}%`,
                        background: "rgb(200,169,110)",
                        borderRadius: "2px",
                      }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "4px",
                    }}
                  >
                    <span
                      style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}
                    >
                      {extractFilenameFromPath((r as FuzzyResult).path)}
                    </span>
                    <ArrowSquareOut
                      size={14}
                      style={{ cursor: "pointer", color: "var(--text-muted)" }}
                      onClick={() => router.push(`/app/documents`)}
                    />
                  </div>
                  <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    Line {(r as FuzzyResult).line}
                  </p>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "var(--text-secondary)",
                      marginTop: "8px",
                    }}
                    dangerouslySetInnerHTML={{
                      __html: highlightMatch((r as FuzzyResult).text, query),
                    }}
                  />
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
