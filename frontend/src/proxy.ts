import { type NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/features/auth/auth.constants";

export function proxy(request: NextRequest) {
  if (!request.cookies.has(AUTH_COOKIE_NAME)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/lesson/:path*"],
};
