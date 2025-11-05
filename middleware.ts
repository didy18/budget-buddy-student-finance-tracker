import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  
  const isAuthPage = request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/register";
  const isProtectedRoute = ["/", "/transactions", "/budget", "/reminders", "/settings"].includes(request.nextUrl.pathname);

  // Redirect to dashboard if user is authenticated and tries to access auth pages
  if (isAuthPage && session?.user) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Redirect to login if user is not authenticated and tries to access protected routes
  if (isProtectedRoute && !session?.user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/transactions", "/budget", "/reminders", "/settings", "/login", "/register"],
};