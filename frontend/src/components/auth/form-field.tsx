"use client"

import { useState } from "react"

interface FormFieldProps {
  label: string
  id: string
  type?: string
  value: string
  onChange: (v: string) => void
  error?: string
  disabled?: boolean
  autoComplete?: string
  placeholder?: string
  rightElement?: React.ReactNode
}

export function FormField({
  label,
  id,
  type = "text",
  value,
  onChange,
  error,
  disabled,
  autoComplete,
  placeholder,
  rightElement,
}: FormFieldProps) {
  const [focused, setFocused] = useState(false)

  const borderColor = error
    ? "var(--semantic-error)"
    : focused
    ? "rgba(200,169,110,0.6)"
    : "var(--border-default)"

  return (
    <div>
      <label
        htmlFor={id}
        style={{
          display: "block",
          fontSize: "12px",
          color: "var(--text-secondary)",
          marginBottom: "6px",
        }}
      >
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={disabled}
          autoComplete={autoComplete}
          placeholder={placeholder}
          style={{
            display: "block",
            width: "100%",
            height: "40px",
            borderRadius: "6px",
            border: `1px solid ${borderColor}`,
            background: "var(--surface-base)",
            padding: rightElement ? "0 40px 0 12px" : "0 12px",
            fontSize: "14px",
            color: "var(--text-primary)",
            outline: "none",
            boxSizing: "border-box",
            opacity: disabled ? 0.5 : 1,
            cursor: disabled ? "not-allowed" : "text",
            transition: "border-color 0.15s",
          }}
        />
        {rightElement && (
          <div
            style={{
              position: "absolute",
              right: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              display: "flex",
              alignItems: "center",
            }}
          >
            {rightElement}
          </div>
        )}
      </div>
      {error && (
        <p style={{ fontSize: "12px", color: "var(--semantic-error)", marginTop: "6px" }}>
          {error}
        </p>
      )}
    </div>
  )
}
