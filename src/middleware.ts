import { auth } from "@/lib/auth"
 
export default auth((req) => {
  const isPublicPath = req.nextUrl.pathname === "/login" || req.nextUrl.pathname === "/"
  
  if (!req.auth && !isPublicPath) {
    const newUrl = new URL("/login", req.nextUrl.origin)
    return Response.redirect(newUrl)
  }
})

// Protect all routes except public ones
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}