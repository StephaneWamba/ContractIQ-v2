export default function BillingPage() {
  return (
    <div>
      <h2
        style={{
          fontSize: "16px",
          fontWeight: 600,
          color: "var(--text-primary)",
          marginBottom: "8px",
        }}
      >
        Billing
      </h2>
      <p
        style={{
          fontSize: "14px",
          color: "var(--text-secondary)",
          marginBottom: "24px",
        }}
      >
        You&apos;re on the Free plan.
      </p>
      <button
        disabled
        style={{
          padding: "8px 16px",
          borderRadius: "6px",
          border: "1px solid var(--border-default)",
          background: "transparent",
          color: "var(--text-muted)",
          cursor: "not-allowed",
          fontSize: "14px",
        }}
      >
        Upgrade — coming soon
      </button>
    </div>
  )
}
