"use client"
import { useState, useEffect, useRef } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { DropOverlay } from "@/components/upload/drop-overlay"
import { AnimatePresence } from "framer-motion"
import { Toaster } from "sonner"
import { List } from "@phosphor-icons/react"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isDragging, setIsDragging] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const dragCounterRef = useRef(0)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  useEffect(() => {
    const onDragEnter = (e: DragEvent) => {
      dragCounterRef.current++
      if (e.dataTransfer?.types.includes("Files")) setIsDragging(true)
    }
    const onDragLeave = () => {
      dragCounterRef.current--
      if (dragCounterRef.current <= 0) {
        dragCounterRef.current = 0
        setIsDragging(false)
      }
    }
    const onDrop = () => {
      dragCounterRef.current = 0
      setIsDragging(false)
    }
    window.addEventListener("dragenter", onDragEnter)
    window.addEventListener("dragleave", onDragLeave)
    window.addEventListener("drop", onDrop)
    return () => {
      window.removeEventListener("dragenter", onDragEnter)
      window.removeEventListener("dragleave", onDragLeave)
      window.removeEventListener("drop", onDrop)
    }
  }, [])

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {!isMobile && <Sidebar />}
      {isMobile && (
        <Sidebar
          mobileOpen={mobileMenuOpen}
          onMobileClose={() => setMobileMenuOpen(false)}
        />
      )}
      <main
        style={{
          flex: 1,
          overflow: "auto",
          padding: isMobile ? "16px" : "40px 48px",
          minWidth: 0,
        }}
      >
        {isMobile && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "16px",
            }}
          >
            <button
              onClick={() => setMobileMenuOpen(true)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted)",
                padding: "4px",
                display: "flex",
                alignItems: "center",
              }}
              aria-label="Open menu"
            >
              <List size={20} />
            </button>
            <span
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "16px",
                color: "var(--accent-gold)",
              }}
            >
              ContractIQ
            </span>
          </div>
        )}
        {children}
      </main>
      <AnimatePresence>
        {isDragging && <DropOverlay visible={isDragging} />}
      </AnimatePresence>
      <Toaster theme="dark" position="bottom-right" />
    </div>
  )
}
