import { ObjectId } from "mongodb"
import { getDb } from "../db"
import type { Page } from "../types"
import { logger } from "../logger"

export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname
  } catch {
    return url
  }
}

export async function upsertPage(
  userId: ObjectId,
  url: string,
  title: string,
  description?: string
): Promise<Page> {
  const db = await getDb()
  const domain = extractDomain(url)
  const now = new Date()

  const result = await db.collection<Page>("pages").findOneAndUpdate(
    { userId, url },
    {
      $set: {
        title,
        description: description || null,
        domain,
        lastSeenAt: now,
        updatedAt: now,
      },
      $setOnInsert: {
        userId,
        url,
        firstSeenAt: now,
        ai: {
          productivityLabel: null,
          confidence: null,
          embedding: null,
        },
      },
    },
    { upsert: true, returnDocument: "after" }
  )

  if (!result) {
    throw new Error("Failed to upsert page")
  }

  logger.info("Page upserted", {
    userId: userId.toString(),
    meta: { url, domain },
  })

  return result
}

export async function getPages(
  userId: ObjectId,
  page: number = 1,
  limit: number = 20
): Promise<{ pages: Page[]; total: number; page: number; totalPages: number }> {
  const db = await getDb()
  const skip = (page - 1) * limit

  const [pages, total] = await Promise.all([
    db
      .collection<Page>("pages")
      .find({ userId })
      .sort({ lastSeenAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray(),
    db.collection<Page>("pages").countDocuments({ userId }),
  ])

  return {
    pages,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  }
}

export async function searchPages(
  userId: ObjectId,
  query: string,
  limit: number = 10
): Promise<Page[]> {
  const db = await getDb()
  
  return db
    .collection<Page>("pages")
    .find({
      userId,
      $or: [
        { title: { $regex: query, $options: "i" } },
        { url: { $regex: query, $options: "i" } },
        { domain: { $regex: query, $options: "i" } },
      ],
    })
    .sort({ lastSeenAt: -1 })
    .limit(limit)
    .toArray()
}
