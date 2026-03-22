import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default auth((req) => {
  const { nextUrl, auth: session } = req;

  const isLoggedIn = !!session;
  const isProtectedRoute =
    nextUrl.pathname.startsWith("/dashboard") ||
    nextUrl.pathname.startsWith("/book") ||
    nextUrl.pathname.startsWith("/admin");

  const isAdminRoute = nextUrl.pathname.startsWith("/admin");
  const isAuthRoute = nextUrl.pathname.startsWith("/login") || nextUrl.pathname.startsWith("/register");

  if (isProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL(`/login?callbackUrl=${nextUrl.pathname}`, nextUrl));
  }

  if (isAdminRoute && isLoggedIn && (session as { user?: { role?: string } }).user?.role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  if (isAuthRoute && isLoggedIn) {
    const role = (session as { user?: { role?: string } }).user?.role;
    if (role === "admin") return NextResponse.redirect(new URL("/admin", nextUrl));
    if (role === "owner") return NextResponse.redirect(new URL("/owner", nextUrl));
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  return NextResponse.next();
}) as (req: NextRequest) => Response | Promise<Response>;

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|images|public).*)"],
};
