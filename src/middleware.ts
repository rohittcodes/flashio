import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export default withAuth(
  function middleware(req) {
    const isLogin = req.nextUrl.pathname === "/login"
    const isAuthed = !!req.nextauth?.token

    // Redirect authenticated users away from login
    if (isLogin && isAuthed) {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    },
    pages: {
      signIn: "/login"
    }
  }
)

// Protect all routes except public ones
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/private/:path*",
    "/login"
  ]
}