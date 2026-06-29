import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const host = req.headers.get("host") || "";

  // Detect blog subdomain — works for blog.tractar.com and blog.localhost:3000
  const isBlog = host.startsWith("blog.");

  if (isBlog) {
    const url = req.nextUrl.clone();
    // Rewrite blog.tractar.com/          → /blog
    // Rewrite blog.tractar.com/my-post   → /blog/my-post
    const path = url.pathname === "/" ? "" : url.pathname;
    url.pathname = `/blog${path}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  // Run on all paths except Next.js internals and static files
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
