import { ObjectId } from "mongodb";
import { getDb } from "../db";
import type { ActivityLog, LogPayload, Page } from "../types";
import { logger } from "../logger";

export async function getTodaysActivity(
  userId: ObjectId,
): Promise<
  Array<{
    pageId: ObjectId;
    title: string;
    url: string;
    domain: string;
    totalDuration: number;
    projectName: string | null;
  }>
> {
  const db = await getDb();

  const now = new Date();
  const start = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0,
  );
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);

  const results = await db
    .collection<ActivityLog>("activity_logs")
    .aggregate([
      {
        $match: {
          "metadata.userId": userId,
          timestamp: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: "$pageId",
          totalDuration: { $sum: "$duration" },
          projectId: { $first: "$metadata.projectId" },
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
      { $unwind: { path: "$page", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "projects",
          localField: "projectId",
          foreignField: "_id",
          as: "project",
        },
      },
      { $unwind: { path: "$project", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          pageId: "$_id",
          title: { $ifNull: ["$page.title", "Unknown"] },
          url: { $ifNull: ["$page.url", "Unknown"] },
          domain: { $ifNull: ["$page.domain", "Unknown"] },
          totalDuration: 1,
          projectName: { $ifNull: ["$project.name", null] },
        },
      },
      { $sort: { totalDuration: -1 } },
    ])
    .toArray();

  return results as Array<{
    pageId: ObjectId;
    title: string;
    url: string;
    domain: string;
    totalDuration: number;
    projectName: string | null;
  }>;
}

export async function getThisWeeksActivity(
  userId: ObjectId,
): Promise<
  Array<{
    pageId: ObjectId;
    title: string;
    url: string;
    domain: string;
    totalDuration: number;
    projectName: string | null;
  }>
> {
  const db = await getDb();

  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0,
  );
  const start = new Date(startOfToday.getTime() - 6 * 24 * 60 * 60 * 1000); // last 7 days including today
  const end = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000 - 1);

  const results = await db
    .collection<ActivityLog>("activity_logs")
    .aggregate([
      {
        $match: {
          "metadata.userId": userId,
          timestamp: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: "$pageId",
          totalDuration: { $sum: "$duration" },
          projectId: { $first: "$metadata.projectId" },
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
      { $unwind: { path: "$page", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "projects",
          localField: "projectId",
          foreignField: "_id",
          as: "project",
        },
      },
      { $unwind: { path: "$project", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          pageId: "$_id",
          title: { $ifNull: ["$page.title", "Unknown"] },
          url: { $ifNull: ["$page.url", "Unknown"] },
          domain: { $ifNull: ["$page.domain", "Unknown"] },
          totalDuration: 1,
          projectName: { $ifNull: ["$project.name", null] },
        },
      },
      { $sort: { totalDuration: -1 } },
    ])
    .toArray();

  return results as Array<{
    pageId: ObjectId;
    title: string;
    url: string;
    domain: string;
    totalDuration: number;
    projectName: string | null;
  }>;
}
