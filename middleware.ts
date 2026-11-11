import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  if (process.env.NAVIMIND_WORKSPACE_MODE === "private") {
    return NextResponse.redirect(new URL("/workspace", request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/", "/chat"] };
