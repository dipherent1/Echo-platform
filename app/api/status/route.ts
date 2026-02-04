import { NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/auth"
import { logger } from "@/lib/logger"
import { corsHeaders, corsResponse } from "@/lib/cors"

export async function OPTIONS(request: NextRequest) {
  return corsResponse(request)
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin")
  const headers = corsHeaders(origin)

  try {
    const authHeader = request.headers.get("authorization")
    const user = await authenticateRequest(authHeader)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers })
    }

    logger.info("Status check successful", {
      userId: user._id.toString(),
      endpoint: "/api/status",
      statusCode: 200,
    })

    return NextResponse.json({
      status: "active",
      user: user.email || user.username || "user",
      timestamp: new Date().toISOString(),
    }, { headers })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to check status"
    logger.error("Status check failed", { meta: { error: message } })

    return NextResponse.json({ error: message }, { status: 500, headers })
  }
}
