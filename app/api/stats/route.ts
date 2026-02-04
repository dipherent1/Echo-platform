import { NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/auth"
import { getTimeStats, getRecentActivity } from "@/lib/services/activity-service"
import { logger } from "@/lib/logger"

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const user = await authenticateRequest(authHeader)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const range = searchParams.get("range") || "week"

    // Calculate date range
    const endDate = new Date()
    let startDate: Date

    switch (range) {
      case "today":
        startDate = new Date()
        startDate.setHours(0, 0, 0, 0)
        break
      case "week":
        startDate = new Date()
        startDate.setDate(startDate.getDate() - 7)
        startDate.setHours(0, 0, 0, 0)
        break
      case "month":
        startDate = new Date()
        startDate.setMonth(startDate.getMonth() - 1)
        startDate.setHours(0, 0, 0, 0)
        break
      default:
        startDate = new Date()
        startDate.setDate(startDate.getDate() - 7)
        startDate.setHours(0, 0, 0, 0)
    }

    const [stats, recentActivity] = await Promise.all([
      getTimeStats(user._id, startDate, endDate),
      getRecentActivity(user._id, 20),
    ])

    logger.info("Stats fetched", {
      userId: user._id.toString(),
      endpoint: "/api/stats",
      meta: { range },
    })

    return NextResponse.json({
      range,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      summary: {
        totalDuration: stats.totalDuration,
        totalDurationFormatted: formatDuration(stats.totalDuration),
      },
      byProject: stats.byProject.map((p) => ({
        projectId: p.projectId?.toString() || null,
        projectName: p.projectName || "Uncategorized",
        color: p.color || "#6b7280",
        totalDuration: p.totalDuration,
        totalDurationFormatted: formatDuration(p.totalDuration),
      })),
      byDomain: stats.byDomain.map((d) => ({
        domain: d.domain,
        totalDuration: d.totalDuration,
        totalDurationFormatted: formatDuration(d.totalDuration),
      })),
      heatmap: stats.byHour.map((h) => ({
        hour: h.hour,
        dayOfWeek: h.dayOfWeek,
        totalDuration: h.totalDuration,
      })),
      topPages: stats.topPages.map((p) => ({
        pageId: p.pageId.toString(),
        title: p.title,
        url: p.url,
        domain: p.domain,
        totalDuration: p.totalDuration,
        totalDurationFormatted: formatDuration(p.totalDuration),
      })),
      recentActivity: recentActivity.map((a) => ({
        id: a._id.toString(),
        timestamp: a.timestamp,
        duration: a.duration,
        durationFormatted: formatDuration(a.duration),
        domain: a.metadata.domain,
        projectId: a.metadata.projectId?.toString() || null,
        page: a.page
          ? {
              title: a.page.title,
              url: a.page.url,
              domain: a.page.domain,
            }
          : null,
      })),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch stats"
    logger.error("Stats endpoint failed", { meta: { error: message } })

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
