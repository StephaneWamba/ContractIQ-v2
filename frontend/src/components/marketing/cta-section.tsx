import Link from "next/link"

export function CtaSection() {
  return (
    <section
      style={{
        paddingTop: "160px",
        paddingBottom: "160px",
        paddingInline: "24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position: "absolute",
          bottom: "-100px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "600px",
          height: "400px",
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse, rgba(200,169,110,0.05) 0%, transparent 70%)",
          filter: "blur(60px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <div
        style={{ position: "relative", zIndex: 1, textAlign: "center" }}
      >
        <h2
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "clamp(32px, 4vw, 52px)",
            fontWeight: 400,
            color: "var(--text-primary)",
            marginBottom: "24px",
            marginTop: 0,
            lineHeight: 1.2,
          }}
        >
          Sign the right contracts.
          <br />
          On your terms.
        </h2>
        <p
          style={{
            fontSize: "16px",
            color: "var(--text-secondary)",
            maxWidth: "440px",
            margin: "0 auto 40px",
            lineHeight: 1.6,
          }}
        >
          Built for founders who can&rsquo;t afford to miss what&rsquo;s in the
          fine print.
        </p>
        <Link
          href="/register"
          style={{
            display: "inline-flex",
            alignItems: "center",
            height: "48px",
            paddingInline: "32px",
            borderRadius: "8px",
            background: "var(--accent-gold)",
            color: "#0C0C0E",
            fontSize: "15px",
            fontWeight: 500,
            textDecoration: "none",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18)",
          }}
        >
          Analyze a contract — it&rsquo;s free
        </Link>
      </div>
    </section>
  )
}
