"use client"
import { useState, useEffect, useCallback } from "react"
import { getToken } from "@/lib/auth"

export interface Document {
  id: string
  filename: string
  contract_type: string
  party_perspective: string
  status: "pending" | "processing" | "ready" | "failed"
  page_count: number | null
  created_at: string
  error_message?: string
}

export function useDocuments(workspaceId: string | null) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDocs = useCallback(async () => {
    if (!workspaceId) return
    const token = getToken()
    if (!token) return
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/documents?workspace_id=${workspaceId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (!res.ok) throw new Error("Failed to fetch documents")
      const data = await res.json()
      setDocuments(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    fetchDocs()
  }, [fetchDocs])

  // Poll every 8 seconds if any document is processing
  useEffect(() => {
    if (!workspaceId) return
    const hasProcessing = documents.some(
      (d) => d.status === "processing" || d.status === "pending"
    )
    if (!hasProcessing) return
    const interval = setInterval(fetchDocs, 8000)
    return () => clearInterval(interval)
  }, [documents, workspaceId, fetchDocs])

  return { documents, loading, error, refetch: fetchDocs }
}
