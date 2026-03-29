import Link from "next/link"

export function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--border-subtle)",
        padding: "40px 0",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 48px",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "16px",
            color: "var(--accent-gold)",
          }}
        >
          ContractIQ
        </span>
        <div style={{ display: "flex", gap: "24px" }}>
          {(["Privacy", "Terms"] as const).map((t) => (
            <Link
              key={t}
              href={`/${t.toLowerCase()}`}
              style={{
                fontSize: "13px",
                color: "var(--text-muted)",
                textDecoration: "none",
              }}
            >
              {t}
            </Link>
          ))}
        </div>
        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
          © 2026 ContractIQ
        </span>
      </div>
    </footer>
  )
}
