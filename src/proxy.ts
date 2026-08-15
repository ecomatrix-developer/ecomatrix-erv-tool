import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/session-middleware";

export function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm|wav|mp3|m4a|aac|oga|woff|woff2|ttf|eot|css|js|epw|pdf|ico)).*)",
  ],
};
