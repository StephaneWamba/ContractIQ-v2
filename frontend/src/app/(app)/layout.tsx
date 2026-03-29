"use client"
import { useState, useEffect, useRef } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { DropOverlay } from "@/components/upload/drop-overlay"
import { AnimatePresence } from "framer-motion"
import { Toaster } from "sonner"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isDragging, setIsDragging] = useState(false)
  const dragCounterRef = useRef(0)

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
      <Sidebar />
      <main
        style={{
          flex: 1,
          overflow: "auto",
          padding: "40px 48px",
          minWidth: 0,
        }}
      >
        {children}
      </main>
      <AnimatePresence>
        {isDragging && <DropOverlay visible={isDragging} />}
      </AnimatePresence>
      <Toaster theme="dark" position="bottom-right" />
    </div>
  )
}
