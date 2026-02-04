import { NextRequest, NextResponse } from "next/server"
import { loginUser, regenerateToken } from "@/lib/services/user-service"
import { authenticateRequest } from "@/lib/auth"
import { logger } from "@/lib/logger"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const authHeader = request.headers.get("authorization")

    // Method 1: Authenticate with existing token
    if (authHeader) {
      const user = await authenticateRequest(authHeader)
      if (!user) {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 })
      }

      const newToken = await regenerateToken(user._id)

      return NextResponse.json({
        success: true,
        token: newToken,
        message: "Token regenerated. Update your extension with this new token.",
      })
    }

    // Method 2: Authenticate with username/password
    const { username, password } = body
    if (!username || !password) {
      return NextResponse.json(
        { error: "Provide either Bearer token or username/password" },
        { status: 400 }
      )
    }

    const { token } = await loginUser(username, password)

    return NextResponse.json({
      success: true,
      token,
      message: "Token regenerated. Update your extension with this new token.",
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Token regeneration failed"
    logger.error("Token regeneration failed", { meta: { error: message } })

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
