import { NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/auth"
import { completeOnboarding } from "@/lib/services/onboarding-service"
import { logger } from "@/lib/logger"

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")

    if (!authHeader) {
      return NextResponse.json(
        { error: "No authorization header" },
        { status: 401 }
      )
    }

    const user = await authenticateRequest(authHeader)

    if (!user) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      )
    }

    await completeOnboarding(user._id.toString())

    return NextResponse.json({
      success: true,
      message: "Onboarding completed",
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to complete onboarding"
    logger.error("Onboarding completion failed", { meta: { error: message } })

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
