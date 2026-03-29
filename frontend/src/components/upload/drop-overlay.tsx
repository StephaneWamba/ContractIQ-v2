"use client"
import { motion } from "framer-motion"
import { FilePdf } from "@phosphor-icons/react"

interface DropOverlayProps {
  visible: boolean
}

export function DropOverlay({ visible }: DropOverlayProps) {
  if (!visible) return null
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9998,
        background: "rgba(12, 12, 14, 0.88)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "480px",
          height: "240px",
          border: "2px dashed var(--accent-gold)",
          borderRadius: "16px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
          animation: "drop-pulse 1.5s ease-in-out infinite",
        }}
      >
        <FilePdf size={48} color="var(--accent-gold)" />
        <p style={{ fontSize: "18px", color: "var(--text-primary)", fontWeight: 500 }}>
          Drop to analyze
        </p>
        <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>PDF only · max 50MB</p>
      </div>
    </motion.div>
  )
}
