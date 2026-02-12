import { NextRequest, NextResponse } from "next/server"
import { createUser } from "@/lib/services/user-service"
import { logger } from "@/lib/logger"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      )
    }

    const { user, token } = await createUser(username, password)

    return NextResponse.json({
      success: true,
      userId: user._id.toString(),
      token,
      hasOnboarded: false,
      message: "User created successfully. Save this token for API access.",
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration failed"
    logger.error("Registration failed", { meta: { error: message } })

    if (message === "User already exists") {
      return NextResponse.json(
        { error: "An account with this email already exists. Please sign in instead." },
        { status: 409 }
      )
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
