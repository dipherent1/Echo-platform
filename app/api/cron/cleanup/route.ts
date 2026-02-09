import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function GET(req: Request) {
  try {
    // Optional: Verify header if you want to secure this endpoint
    // const authHeader = req.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //   return new Response('Unauthorized', { status: 401 });
    // }

    const db = await getDb();

    // Calculate 2 weeks ago
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    // clean up activity logs
    // Deleting logs older than 2 weeks
    const logsResult = await db.collection("activity_logs").deleteMany({
      timestamp: { $lt: twoWeeksAgo },
    });

    // clean up pages
    // Deleting pages that haven't been seen in the last 2 weeks
    const pagesResult = await db.collection("pages").deleteMany({
      lastSeenAt: { $lt: twoWeeksAgo },
    });

    const message = `Cleanup job ran. Deleted ${logsResult.deletedCount} logs and ${pagesResult.deletedCount} pages.`;
    logger.info(message);

    return NextResponse.json({
      success: true,
      deletedLogs: logsResult.deletedCount,
      deletedPages: pagesResult.deletedCount,
      cutoffDate: twoWeeksAgo,
    });
  } catch (error) {
    logger.error("Cleanup job failed", { meta: { error } });
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
