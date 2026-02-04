import { NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/auth"
import { logger } from "@/lib/logger"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const user = await authenticateRequest(authHeader)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to check status"
    logger.error("Status check failed", { meta: { error: message } })

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
