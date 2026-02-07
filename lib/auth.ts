import { createHash, randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { getDb } from "./db";
import type { User } from "./types";
import { ObjectId } from "mongodb";

const scryptAsync = promisify(scrypt);

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  try {
    const [salt, hash] = storedHash.split(":");
    const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
    const hashBuffer = Buffer.from(hash, "hex");
    return timingSafeEqual(derivedKey, hashBuffer);
  } catch {
    return false;
  }
}

export async function getUserByToken(token: string): Promise<User | null> {
  const db = await getDb();
  const hash = hashToken(token);

  // Check both extension api token and dashboard session token
  const user = await db.collection<User>("users").findOneAndUpdate(
    {
      $or: [{ tokenHash: hash }, { sessionTokenHash: hash }],
    },
    { $set: { tokenLastUsedAt: new Date() } },
    { returnDocument: "after" },
  );

  return user;
}

export async function getUserById(
  userId: string | ObjectId,
): Promise<User | null> {
  const db = await getDb();
  const id = typeof userId === "string" ? new ObjectId(userId) : userId;
  return db.collection<User>("users").findOne({ _id: id });
}

export async function authenticateRequest(
  authHeader: string | null,
): Promise<User | null> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7);
  return getUserByToken(token);
}

export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.slice(7);
}
