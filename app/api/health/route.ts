import { NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/auth"
import { logger } from "@/lib/logger"
import { corsHeaders, corsResponse } from "@/lib/cors"

interface HealthPayload {
  extensionVersion: string
  platform: string
  arch: string
  errorsEncountered: number
  timestamp: string
}

export async function OPTIONS(request: NextRequest) {
  return corsResponse(request)
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin")
  const headers = corsHeaders(origin)

  try {
    const authHeader = request.headers.get("authorization")
    const user = await authenticateRequest(authHeader)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers })
    }

    const body = await request.json() as HealthPayload

    // Validate required fields
    if (!body.extensionVersion || !body.platform || !body.arch || body.errorsEncountered === undefined || !body.timestamp) {
      return NextResponse.json(
        { error: "Missing required fields: extensionVersion, platform, arch, errorsEncountered, timestamp" },
        { status: 400, headers }
      )
    }

    logger.info("Health check received", {
      userId: user._id.toString(),
      endpoint: "/api/health",
      extensionVersion: body.extensionVersion,
      platform: body.platform,
      arch: body.arch,
      errorsEncountered: body.errorsEncountered,
      timestamp: body.timestamp,
      statusCode: 200,
    })

    return NextResponse.json({
      success: true,
      message: "Health telemetry received",
      timestamp: new Date().toISOString(),
    }, { headers })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to process health check"
    logger.error("Health check failed", { meta: { error: message } })

    return NextResponse.json({ error: message }, { status: 500, headers })
  }
}
