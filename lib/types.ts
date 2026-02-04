import { ObjectId } from "mongodb"

export interface User {
  _id: ObjectId
  username: string
  passwordHash: string
  tokenHash: string | null
  tokenCreatedAt: Date | null
  tokenLastUsedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface Page {
  _id: ObjectId
  userId: ObjectId
  url: string
  domain: string
  title: string
  description: string | null
  firstSeenAt: Date
  lastSeenAt: Date
  ai: {
    productivityLabel: string | null
    confidence: number | null
    embedding: number[] | null
  }
}

export interface ProjectRule {
  type: "domain" | "url_contains" | "manual_url"
  value: string
}

export interface Project {
  _id: ObjectId
  userId: ObjectId
  name: string
  color: string
  rules: ProjectRule[]
  createdAt: Date
  updatedAt: Date
}

export interface ActivityLog {
  _id: ObjectId
  timestamp: Date
  duration: number
  pageId: ObjectId
  metadata: {
    userId: ObjectId
    domain: string
    projectId: ObjectId | null
    source: {
      type: string
      deviceName: string | null
      clientId: string | null
    }
  }
}

export interface LogPayload {
  url: string
  title: string
  duration: number
  timestamp: string
  description?: string
  source?: {
    type?: string
    deviceName?: string
    clientId?: string
  }
}
