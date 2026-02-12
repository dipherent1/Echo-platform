import { ObjectId } from "mongodb";
import { getDb } from "../db";
import type { User } from "../types";
import {
  hashPassword,
  verifyPassword,
  generateToken,
  hashToken,
} from "../auth";
import { logger } from "../logger";

export async function createUser(
  username: string,
  password: string,
): Promise<{ user: User; token: string }> {
  const db = await getDb();

  // Check if user already exists
  const existingUser = await db.collection<User>("users").findOne({ username });
  if (existingUser) {
    throw new Error("User already exists");
  }

  const passwordHash = await hashPassword(password);

  // Generate Extension API Token (long-lived)
  const apiToken = generateToken();
  const tokenHash = hashToken(apiToken);

  // Generate Dashboard Session Token (short-lived/session-based)
  const sessionToken = generateToken();
  const sessionTokenHash = hashToken(sessionToken);

  const now = new Date();

  const user: Omit<User, "_id"> = {
    username,
    passwordHash,
    tokenHash, // Extension API Token Hash
    sessionTokenHash, // Dashboard Session Token Hash
    tokenCreatedAt: now,
    tokenLastUsedAt: null,
    hasOnboarded: false,
    createdAt: now,
    updatedAt: now,
  };

  const result = await db.collection<User>("users").insertOne(user as User);

  logger.info("User created", { userId: result.insertedId.toString() });

  return {
    user: { ...user, _id: result.insertedId } as User,
    token: sessionToken, // Return session token for immediate login
  };
}

export async function loginUser(
  username: string,
  password: string,
): Promise<{ user: User; token: string }> {
  const db = await getDb();

  const user = await db.collection<User>("users").findOne({ username });
  if (!user) {
    throw new Error("Invalid credentials");
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    throw new Error("Invalid credentials");
  }

  // Generate new session token for this login
  const sessionToken = generateToken();
  const sessionTokenHash = hashToken(sessionToken);

  await db.collection<User>("users").updateOne(
    { _id: user._id },
    {
      $set: {
        sessionTokenHash,
        tokenLastUsedAt: new Date(), // Update activity
        updatedAt: new Date(),
      },
    },
  );

  logger.info("User logged in", { userId: user._id.toString() });

  // Return the session token. NEVER return the API token here.
  return {
    user: { ...user, sessionTokenHash, updatedAt: new Date() },
    token: sessionToken,
  };
}

export async function regenerateToken(userId: ObjectId): Promise<string> {
  const db = await getDb();
  // Generate new Extension API Token
  const apiToken = generateToken();
  const tokenHash = hashToken(apiToken);
  const now = new Date();

  await db.collection<User>("users").updateOne(
    { _id: userId },
    {
      $set: {
        tokenHash,
        tokenCreatedAt: now,
        updatedAt: now,
      },
    },
  );

  logger.info("Token regenerated", { userId: userId.toString() });

  // Return the raw API token so the user can see it (once)
  return apiToken;
}

export async function getUserByUsername(
  username: string,
): Promise<User | null> {
  const db = await getDb();
  return db.collection<User>("users").findOne({ username });
}

export async function updateUserPassword(
  userId: ObjectId,
  newPassword: string,
): Promise<void> {
  const db = await getDb();
  const passwordHash = await hashPassword(newPassword);

  await db.collection<User>("users").updateOne(
    { _id: userId },
    {
      $set: {
        passwordHash,
        updatedAt: new Date(),
      },
    },
  );

  logger.info("Password updated", { userId: userId.toString() });
}
