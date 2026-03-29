import Link from "next/link"
import { ProductPreviewPanel } from "@/components/auth/product-preview-panel"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left column - form area */}
      <div className="flex-1 lg:w-[55%] lg:flex-none flex flex-col p-8 lg:p-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mb-auto pb-8">
          <span style={{ fontFamily: "var(--font-serif)", fontSize: "18px", color: "var(--accent-gold)" }}>
            ContractIQ
          </span>
        </Link>
        {/* Form content - centered vertically */}
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-[400px]">
            {children}
          </div>
        </div>
      </div>

      {/* Right column - product preview panel - hidden on mobile */}
      <div
        className="hidden lg:flex lg:w-[45%] flex-col justify-between p-16"
        style={{
          background: "var(--surface-elevated)",
          borderLeft: "1px solid var(--border-subtle)",
        }}
      >
        <ProductPreviewPanel />
      </div>
    </div>
  )
}
