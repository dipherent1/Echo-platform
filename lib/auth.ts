import { createHash, randomBytes } from "crypto"
import bcrypt from "bcryptjs"
import { getDb } from "./db"
import type { User } from "./types"
import { ObjectId } from "mongodb"

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

export function generateToken(): string {
  return randomBytes(32).toString("hex")
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  return bcrypt.compare(password, storedHash)
}

export async function getUserByToken(token: string): Promise<User | null> {
  const db = await getDb()
  const tokenHash = hashToken(token)
  
  const user = await db.collection<User>("users").findOneAndUpdate(
    { tokenHash },
    { $set: { tokenLastUsedAt: new Date() } },
    { returnDocument: "after" }
  )
  
  return user
}

export async function getUserById(userId: string | ObjectId): Promise<User | null> {
  const db = await getDb()
  const id = typeof userId === "string" ? new ObjectId(userId) : userId
  return db.collection<User>("users").findOne({ _id: id })
}

export async function authenticateRequest(authHeader: string | null): Promise<User | null> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null
  }
  
  const token = authHeader.slice(7)
  return getUserByToken(token)
}

export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null
  }
  return authHeader.slice(7)
}
