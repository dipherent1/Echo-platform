import { NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/auth"
import { getPages, searchPages } from "@/lib/services/page-service"
import { logger } from "@/lib/logger"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const user = await authenticateRequest(authHeader)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")))
    const query = searchParams.get("q")

    if (query) {
      const pages = await searchPages(user._id, query, limit)
      return NextResponse.json({
        pages: pages.map((p) => ({
          id: p._id.toString(),
          url: p.url,
          domain: p.domain,
          title: p.title,
          description: p.description,
          firstSeenAt: p.firstSeenAt,
          lastSeenAt: p.lastSeenAt,
        })),
        query,
      })
    }

    const result = await getPages(user._id, page, limit)

    logger.info("Pages fetched", {
      userId: user._id.toString(),
      endpoint: "/api/pages",
      meta: { page, limit, total: result.total },
    })

    return NextResponse.json({
      pages: result.pages.map((p) => ({
        id: p._id.toString(),
        url: p.url,
        domain: p.domain,
        title: p.title,
        description: p.description,
        firstSeenAt: p.firstSeenAt,
        lastSeenAt: p.lastSeenAt,
      })),
      pagination: {
        page: result.page,
        limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch pages"
    logger.error("Pages endpoint failed", { meta: { error: message } })

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
