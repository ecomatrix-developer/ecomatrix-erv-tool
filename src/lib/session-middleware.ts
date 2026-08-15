import { NextResponse, type NextRequest } from "next/server";
import { verifySessionCookie, SESSION_COOKIE } from "@/lib/session-edge";

const PUBLIC_ROUTES = ["/login", "/", "/how-it-works"];
const STATIC_FILE_REGEX = /\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm|wav|mp3|m4a|aac|oga|woff|woff2|ttf|eot|css|js|epw|pdf|ico)$/i;

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.includes(pathname)) return true;
  if (STATIC_FILE_REGEX.test(pathname)) return true;
  return pathname.startsWith("/api/") || pathname.startsWith("/_next") || pathname.startsWith("/brand");
}

/** Redirects unauthenticated users away from protected app routes, checking the
 * custom signed session cookie set by src/app/actions/auth.ts's login action. */
export async function updateSession(request: NextRequest) {
  if (isPublicRoute(request.nextUrl.pathname)) {
    return NextResponse.next({ request });
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const authenticated = await verifySessionCookie(token);

  if (!authenticated) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next({ request });
}
