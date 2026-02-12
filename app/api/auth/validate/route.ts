import { NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/auth"
import { logger } from "@/lib/logger"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")

    if (!authHeader) {
      return NextResponse.json(
        { valid: false, error: "No authorization header" },
        { status: 401 }
      )
    }

    const user = await authenticateRequest(authHeader)

    if (!user) {
      return NextResponse.json(
        { valid: false, error: "Invalid token" },
        { status: 401 }
      )
    }

    logger.info("Token validated", { userId: user._id.toString() })

    return NextResponse.json({
      valid: true,
      userId: user._id.toString(),
      username: user.username,
      tokenCreatedAt: user.tokenCreatedAt,
      tokenLastUsedAt: user.tokenLastUsedAt,
      hasOnboarded: user.hasOnboarded || false,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Validation failed"
    logger.error("Token validation failed", { meta: { error: message } })

    return NextResponse.json({ valid: false, error: message }, { status: 500 })
  }
}
