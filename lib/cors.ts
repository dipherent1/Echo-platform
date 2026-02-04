import { NextResponse } from "next/server"

export function corsHeaders(origin?: string | null) {
  // Allow requests from chrome extensions and the web app itself
  const allowedOrigins = [
    "chrome-extension://",
    "moz-extension://",
    process.env.NEXT_PUBLIC_APP_URL || "",
  ]

  const requestOrigin = origin || ""
  const isAllowed =
    allowedOrigins.some((allowed) => requestOrigin.startsWith(allowed)) ||
    requestOrigin.includes("localhost") ||
    requestOrigin.includes("vercel.app")

  return {
    "Access-Control-Allow-Origin": isAllowed ? requestOrigin : "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, X-Requested-With",
    "Access-Control-Max-Age": "86400",
  }
}

export function corsResponse(request: Request) {
  const origin = request.headers.get("origin")
  const headers = corsHeaders(origin)
  return NextResponse.json({ success: true }, { status: 200, headers })
}
