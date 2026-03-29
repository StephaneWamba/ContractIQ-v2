export function SocialProof() {
  return (
    <section
      style={{
        paddingTop: "160px",
        paddingBottom: "160px",
        textAlign: "center",
        paddingInline: "24px",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: "clamp(48px, 8vw, 96px)",
          color: "var(--text-primary)",
          marginBottom: "16px",
          marginTop: 0,
          lineHeight: 1,
        }}
      >
        3,000+
      </p>
      <p
        style={{
          fontSize: "18px",
          color: "var(--text-secondary)",
          margin: 0,
        }}
      >
        contracts analyzed.
      </p>
    </section>
  )
}
