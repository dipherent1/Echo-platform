import { NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/auth"
import { createActivityLog } from "@/lib/services/activity-service"
import { logger } from "@/lib/logger"
import { corsHeaders, corsResponse } from "@/lib/cors"
import type { LogPayload } from "@/lib/types"

export async function OPTIONS(request: NextRequest) {
  return corsResponse(request)
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const origin = request.headers.get("origin")
  const headers = corsHeaders(origin)

  try {
    const authHeader = request.headers.get("authorization")
    const user = await authenticateRequest(authHeader)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers })
    }

    const body = await request.json()

    // Validate required fields
    const { url, title, duration, timestamp } = body as LogPayload

    if (!url || !title || duration === undefined || !timestamp) {
      return NextResponse.json(
        { error: "Missing required fields: url, title, duration, timestamp" },
        { status: 400, headers }
      )
    }

    if (typeof duration !== "number" || duration < 0) {
      return NextResponse.json(
        { error: "Duration must be a positive number" },
        { status: 400, headers }
      )
    }

    const activityLog = await createActivityLog(user._id, body as LogPayload)

    const elapsed = Date.now() - startTime
    logger.info("Log endpoint processed", {
      userId: user._id.toString(),
      endpoint: "/api/log",
      duration: elapsed,
      statusCode: 201,
    })

    return NextResponse.json(
      {
        success: true,
        logId: activityLog._id.toString(),
        pageId: activityLog.pageId.toString(),
        projectId: activityLog.metadata.projectId?.toString() || null,
      },
      { status: 201, headers }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create log"
    logger.error("Log endpoint failed", { meta: { error: message } })

    return NextResponse.json({ error: message }, { status: 500, headers })
  }
}
