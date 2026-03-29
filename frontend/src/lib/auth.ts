const TOKEN_KEY = "ciq_token"

export function setToken(token: string): void {
  if (typeof window === "undefined") return
  localStorage.setItem(TOKEN_KEY, token)
  document.cookie = `ciq_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Strict`
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(TOKEN_KEY)
}

export function clearToken(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(TOKEN_KEY)
  document.cookie = "ciq_token=; path=/; max-age=0"
}

export async function loginUser(email: string, password: string): Promise<string> {
  const form = new URLSearchParams({ username: email, password })
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    }
  )
  if (!res.ok) {
    throw new Error("Invalid credentials")
  }
  const data = await res.json()
  return data.access_token
}

export async function registerUser(email: string, password: string, name: string): Promise<string> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/auth/register`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    }
  )
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { detail?: string }).detail || "Registration failed")
  }
  const data = await res.json()
  return data.access_token
}
