export function ProductPreviewPanel() {
  return (
    <div className="flex flex-col gap-8 h-full">
      {/* Contract excerpt mockup */}
      <div
        className="flex-1 rounded-xl p-6 relative overflow-hidden"
        style={{ background: "var(--surface-overlay)", border: "1px solid var(--border-subtle)" }}
      >
        {/* Clause with highlight */}
        <div className="mb-4">
          <p style={{ fontSize: "10px", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "12px" }}>
            SECTION 8.2 — TERMINATION
          </p>
          <p style={{ fontSize: "13px", lineHeight: "1.7", color: "var(--text-secondary)" }}>
            &ldquo;Either party may terminate this Agreement upon{" "}
            <span
              style={{
                background: "rgba(200, 169, 110, 0.2)",
                borderBottom: "1px solid var(--accent-gold)",
                padding: "1px 2px",
                borderRadius: "2px",
                color: "var(--text-primary)",
              }}
            >
              30 days written notice
            </span>
            . In the event of material breach, the non-breaching party may terminate immediately upon written notice.&rdquo;
          </p>
        </div>

        {/* Analysis callout */}
        <div
          className="rounded-lg p-4 mt-4"
          style={{ background: "var(--surface-base)", border: "1px solid rgba(200,169,110,0.2)" }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border"
              style={{ borderColor: "var(--accent-gold)", color: "var(--accent-gold)", background: "var(--accent-gold-dim)" }}
            >
              MEDIUM RISK
            </span>
          </div>
          <p style={{ fontSize: "12px", lineHeight: "1.6", color: "var(--text-secondary)" }}>
            Unilateral 30-day termination right with no cure period. Consider requesting mutual agreement or a 60-day notice window for stability.
          </p>
        </div>
      </div>

      {/* Social proof */}
      <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
        Analyzed over 3,000 contracts.
      </p>
    </div>
  )
}
