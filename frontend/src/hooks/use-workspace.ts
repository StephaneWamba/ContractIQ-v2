"use client"
import { useState, useEffect } from "react"
import { getToken } from "@/lib/auth"

interface Workspace {
  id: string
  name: string
  created_at: string
}

interface Me {
  id: string
  email: string
  name: string
}

export function useWorkspace() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [me, setMe] = useState<Me | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getToken()
    if (!token) { setLoading(false); return }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL
    Promise.all([
      fetch(`${apiUrl}/workspaces`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${apiUrl}/auth/me`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ])
      .then(([workspaces, meData]) => {
        setWorkspace(Array.isArray(workspaces) ? workspaces[0] : null)
        setMe(meData)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return { workspace, me, loading }
}
