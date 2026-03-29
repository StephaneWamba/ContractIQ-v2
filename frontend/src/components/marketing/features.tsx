"use client"

const FEATURES = [
  {
    number: "01",
    title: "Extract every clause",
    body: "ContractIQ reads the full document and identifies every clause — payment terms, termination rights, IP ownership, liability caps, and more.",
  },
  {
    number: "02",
    title: "Flag every risk",
    body: "Each clause is assessed against your role in the contract. CRITICAL risks surface first. You see exactly what needs attention before signing.",
  },
  {
    number: "03",
    title: "Ask anything",
    body: "Ask plain-English questions about any clause. ContractIQ answers with specific references to the document — not generic legal boilerplate.",
  },
]

export function Features() {
  return (
    <section
      style={{
        paddingTop: "160px",
        paddingBottom: "160px",
        paddingInline: "48px",
        maxWidth: "1200px",
        margin: "0 auto",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* Eyebrow */}
      <div style={{ textAlign: "center", marginBottom: "16px" }}>
        <span
          style={{
            display: "inline-block",
            fontSize: "10px",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--accent-gold)",
          }}
        >
          How it works
        </span>
      </div>

      {/* Section headline */}
      <h2
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: "clamp(28px, 3vw, 40px)",
          fontWeight: 400,
          color: "var(--text-primary)",
          textAlign: "center",
          marginBottom: "64px",
          marginTop: 0,
          lineHeight: 1.2,
        }}
      >
        From upload to clarity in seconds.
      </h2>

      {/* Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "24px",
        }}
      >
        {FEATURES.map((f) => (
          <FeatureCard key={f.number} {...f} />
        ))}
      </div>
    </section>
  )
}

function FeatureCard({
  number,
  title,
  body,
}: {
  number: string
  title: string
  body: string
}) {
  return (
    <div
      style={{
        background: "var(--surface-elevated)",
        borderRadius: "12px",
        border: "1px solid var(--border-subtle)",
        padding: "28px",
        transition: "border-color 150ms",
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLDivElement).style.borderColor =
          "var(--border-default)"
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLDivElement).style.borderColor =
          "var(--border-subtle)"
      }}
    >
      <p
        style={{
          fontSize: "11px",
          color: "var(--text-muted)",
          letterSpacing: "0.1em",
          marginBottom: "16px",
          marginTop: 0,
        }}
      >
        {number}
      </p>
      <h3
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: "20px",
          fontWeight: 400,
          color: "var(--text-primary)",
          marginBottom: "12px",
          marginTop: 0,
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontSize: "14px",
          color: "var(--text-secondary)",
          lineHeight: 1.7,
          margin: 0,
        }}
      >
        {body}
      </p>
    </div>
  )
}
