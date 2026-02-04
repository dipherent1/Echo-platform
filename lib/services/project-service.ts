import { ObjectId } from "mongodb"
import { getDb } from "../db"
import type { Project, ProjectRule } from "../types"
import { logger } from "../logger"

export async function createProject(
  userId: ObjectId,
  name: string,
  color: string,
  rules: ProjectRule[] = []
): Promise<Project> {
  const db = await getDb()
  const now = new Date()

  const project: Omit<Project, "_id"> = {
    userId,
    name,
    color,
    rules,
    createdAt: now,
    updatedAt: now,
  }

  const result = await db.collection<Project>("projects").insertOne(project as Project)

  logger.info("Project created", {
    userId: userId.toString(),
    meta: { projectName: name },
  })

  return { ...project, _id: result.insertedId } as Project
}

export async function getProjects(userId: ObjectId): Promise<Project[]> {
  const db = await getDb()
  return db.collection<Project>("projects").find({ userId }).sort({ createdAt: -1 }).toArray()
}

export async function getProjectById(projectId: ObjectId, userId: ObjectId): Promise<Project | null> {
  const db = await getDb()
  return db.collection<Project>("projects").findOne({ _id: projectId, userId })
}

export async function updateProject(
  projectId: ObjectId,
  userId: ObjectId,
  updates: Partial<Pick<Project, "name" | "color" | "rules">>
): Promise<Project | null> {
  const db = await getDb()
  
  const result = await db.collection<Project>("projects").findOneAndUpdate(
    { _id: projectId, userId },
    { $set: { ...updates, updatedAt: new Date() } },
    { returnDocument: "after" }
  )

  if (result) {
    logger.info("Project updated", {
      userId: userId.toString(),
      meta: { projectId: projectId.toString() },
    })
  }

  return result
}

export async function deleteProject(projectId: ObjectId, userId: ObjectId): Promise<boolean> {
  const db = await getDb()
  const result = await db.collection<Project>("projects").deleteOne({ _id: projectId, userId })

  if (result.deletedCount > 0) {
    logger.info("Project deleted", {
      userId: userId.toString(),
      meta: { projectId: projectId.toString() },
    })
  }

  return result.deletedCount > 0
}

export function matchProjectRules(
  projects: Project[],
  url: string,
  domain: string
): ObjectId | null {
  for (const project of projects) {
    for (const rule of project.rules) {
      if (rule.type === "domain" && domain === rule.value) {
        return project._id
      }
      if (rule.type === "url_contains" && url.includes(rule.value)) {
        return project._id
      }
    }
  }
  return null
}
