import { NextRequest, NextResponse } from "next/server"

export function middleware(req: NextRequest) {
  const token = req.cookies.get("ciq_token")?.value
  const pathname = req.nextUrl.pathname

  const isAppRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/documents") ||
    pathname.startsWith("/search") ||
    pathname.startsWith("/playbooks") ||
    pathname.startsWith("/settings")
  const isAuthRoute =
    pathname === "/login" || pathname === "/register" || pathname === "/forgot-password"

  if (isAppRoute && !token) {
    const url = new URL("/login", req.url)
    url.searchParams.set("next", pathname)
    return NextResponse.redirect(url)
  }

  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/documents/:path*", "/search", "/playbooks/:path*", "/settings/:path*", "/login", "/register", "/forgot-password"],
}
