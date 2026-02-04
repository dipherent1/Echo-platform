import { ObjectId } from "mongodb"
import { getDb } from "../db"
import type { ActivityLog, LogPayload, Page } from "../types"
import { logger } from "../logger"
import { upsertPage, extractDomain } from "./page-service"
import { getProjects, matchProjectRules } from "./project-service"

export async function createActivityLog(
  userId: ObjectId,
  payload: LogPayload
): Promise<ActivityLog> {
  const db = await getDb()

  // Extract domain from URL
  const domain = extractDomain(payload.url)

  // Upsert the page
  const page: Page = await upsertPage(userId, payload.url, payload.title, payload.description)

  // Get user projects and match rules
  const projects = await getProjects(userId)
  const projectId = matchProjectRules(projects, payload.url, domain)

  // Create activity log
  const activityLog: Omit<ActivityLog, "_id"> = {
    timestamp: new Date(payload.timestamp),
    duration: payload.duration,
    pageId: page._id,
    metadata: {
      userId,
      domain,
      projectId,
      source: {
        type: payload.source?.type || "extension",
        deviceName: payload.source?.deviceName || null,
        clientId: payload.source?.clientId || null,
      },
    },
  }

  const result = await db.collection<ActivityLog>("activity_logs").insertOne(activityLog as ActivityLog)

  logger.info("Activity log created", {
    userId: userId.toString(),
    meta: { url: payload.url, domain, duration: payload.duration },
  })

  return { ...activityLog, _id: result.insertedId } as ActivityLog
}

export async function getRecentActivity(
  userId: ObjectId,
  limit: number = 20
): Promise<Array<ActivityLog & { page?: Page }>> {
  const db = await getDb()

  const logs = await db
    .collection<ActivityLog>("activity_logs")
    .aggregate([
      { $match: { "metadata.userId": userId } },
      { $sort: { timestamp: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: "pages",
          localField: "pageId",
          foreignField: "_id",
          as: "page",
        },
      },
      { $unwind: { path: "$page", preserveNullAndEmptyArrays: true } },
    ])
    .toArray()

  return logs as Array<ActivityLog & { page?: Page }>
}

export interface TimeStats {
  totalDuration: number
  byProject: Array<{ projectId: ObjectId | null; projectName: string | null; color: string | null; totalDuration: number }>
  byDomain: Array<{ domain: string; totalDuration: number }>
  byHour: Array<{ hour: number; dayOfWeek: number; totalDuration: number; topUrls: Array<{ title: string; url: string; totalDuration: number }> }>
  topPages: Array<{ pageId: ObjectId; title: string; url: string; domain: string; totalDuration: number }>
}

export async function getTimeStats(
  userId: ObjectId,
  startDate: Date,
  endDate: Date
): Promise<TimeStats> {
  const db = await getDb()

  // Total duration
  const totalResult = await db
    .collection<ActivityLog>("activity_logs")
    .aggregate([
      {
        $match: {
          "metadata.userId": userId,
          timestamp: { $gte: startDate, $lte: endDate },
        },
      },
      { $group: { _id: null, totalDuration: { $sum: "$duration" } } },
    ])
    .toArray()

  const totalDuration = totalResult[0]?.totalDuration || 0

  // By project
  const byProject = await db
    .collection<ActivityLog>("activity_logs")
    .aggregate([
      {
        $match: {
          "metadata.userId": userId,
          timestamp: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: "$metadata.projectId",
          totalDuration: { $sum: "$duration" },
        },
      },
      {
        $lookup: {
          from: "projects",
          localField: "_id",
          foreignField: "_id",
          as: "project",
        },
      },
      { $unwind: { path: "$project", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          projectId: "$_id",
          projectName: { $ifNull: ["$project.name", "Uncategorized"] },
          color: { $ifNull: ["$project.color", "#6b7280"] },
          totalDuration: 1,
        },
      },
      { $sort: { totalDuration: -1 } },
    ])
    .toArray()

  // By domain
  const byDomain = await db
    .collection<ActivityLog>("activity_logs")
    .aggregate([
      {
        $match: {
          "metadata.userId": userId,
          timestamp: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: "$metadata.domain",
          totalDuration: { $sum: "$duration" },
        },
      },
      {
        $project: {
          domain: "$_id",
          totalDuration: 1,
        },
      },
      { $sort: { totalDuration: -1 } },
      { $limit: 10 },
    ])
    .toArray()

  // By hour (for heatmap) - with top URLs
  const byHourDetails = await db
    .collection<ActivityLog>("activity_logs")
    .aggregate([
      {
        $match: {
          "metadata.userId": userId,
          timestamp: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $lookup: {
          from: "pages",
          localField: "pageId",
          foreignField: "_id",
          as: "page",
        },
      },
      { $unwind: { path: "$page", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          hour: { $hour: "$timestamp" },
          dayOfWeek: { $dayOfWeek: "$timestamp" },
          duration: 1,
          pageTitle: { $ifNull: ["$page.title", "Unknown"] },
          pageUrl: { $ifNull: ["$page.url", "Unknown"] },
        },
      },
      {
        $group: {
          _id: { hour: "$hour", dayOfWeek: "$dayOfWeek" },
          totalDuration: { $sum: "$duration" },
          urls: {
            $push: {
              title: "$pageTitle",
              url: "$pageUrl",
              duration: "$duration",
            },
          },
        },
      },
      {
        $project: {
          hour: "$_id.hour",
          dayOfWeek: "$_id.dayOfWeek",
          totalDuration: 1,
          urls: 1,
        },
      },
    ])
    .toArray()

  // Process the URLs: aggregate by URL and sort by total duration
  const byHour = byHourDetails.map((item: any) => {
    const urlMap = new Map<string, { title: string; url: string; totalDuration: number }>()
    
    item.urls.forEach((u: any) => {
      const key = u.url
      if (urlMap.has(key)) {
        const existing = urlMap.get(key)!
        existing.totalDuration += u.duration
      } else {
        urlMap.set(key, {
          title: u.title,
          url: u.url,
          totalDuration: u.duration,
        })
      }
    })

    const topUrls = Array.from(urlMap.values())
      .sort((a, b) => b.totalDuration - a.totalDuration)
      .slice(0, 5)

    return {
      hour: item.hour,
      dayOfWeek: item.dayOfWeek,
      totalDuration: item.totalDuration,
      topUrls,
    }
  })

  // Top pages
  const topPages = await db
    .collection<ActivityLog>("activity_logs")
    .aggregate([
      {
        $match: {
          "metadata.userId": userId,
          timestamp: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: "$pageId",
          totalDuration: { $sum: "$duration" },
        },
      },
      {
        $lookup: {
          from: "pages",
          localField: "_id",
          foreignField: "_id",
          as: "page",
        },
      },
      { $unwind: "$page" },
      {
        $project: {
          pageId: "$_id",
          title: "$page.title",
          url: "$page.url",
          domain: "$page.domain",
          totalDuration: 1,
        },
      },
      { $sort: { totalDuration: -1 } },
      { $limit: 10 },
    ])
    .toArray()

  return {
    totalDuration,
    byProject: byProject as TimeStats["byProject"],
    byDomain: byDomain as TimeStats["byDomain"],
    byHour: byHour as TimeStats["byHour"],
    topPages: topPages as TimeStats["topPages"],
  }
}
