import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const pathname = req.nextUrl.pathname;
  const isOnboarding = pathname.startsWith("/onboarding");

  // If NOT logged in on protected route → force login
  if (!session) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  // If logged in but not onboarded → redirect to onboarding
  if (session && !isOnboarding) {
    const { data: profile } = await supabase
      .from("users")
      .select("has_onboarded")
      .eq("id", session.user.id)
      .single();

    if (profile && profile.has_onboarded === false) {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }
  }

  return res;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/upload/:path*",
    "/listings/:path*",
    "/jobs/:path*",
    "/settings/:path*",
    "/billing/:path*",
  ],
};

