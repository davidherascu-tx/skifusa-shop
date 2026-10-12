import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Cheap early redirect for /account and /admin when there is no session cookie.
 * The real check (valid session, admin flag) happens in the pages and server actions themselves.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if ((pathname.startsWith("/account") || pathname.startsWith("/admin")) && !getSessionCookie(request)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/webhooks|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
