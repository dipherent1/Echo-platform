import { ObjectId } from "mongodb";
import { getDb } from "../db";
import { logger } from "../logger";

export async function completeOnboarding(userId: string): Promise<void> {
  const db = await getDb();

  await db.collection("users").updateOne(
    { _id: new ObjectId(userId) },
    {
      $set: {
        hasOnboarded: true,
        updatedAt: new Date(),
      },
    },
  );

  logger.info("User completed onboarding", { userId });
}
