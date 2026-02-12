import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { getPageStats } from "@/lib/services/activity-service";
import { ObjectId } from "mongodb";
import { logger } from "@/lib/logger";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get("authorization");
    const user = await authenticateRequest(authHeader);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    let startDate: Date;
    let endDate: Date;

    if (startDateParam && endDateParam) {
      startDate = new Date(startDateParam);
      endDate = new Date(endDateParam);
      // Set end date to end of day if it's the same as start or just to be safe
      endDate.setHours(23, 59, 59, 999);
    } else {
      // Default to last 30 days
      endDate = new Date();
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
    }

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid page ID" }, { status: 400 });
    }

    const stats = await getPageStats(
      user._id,
      new ObjectId(id),
      startDate,
      endDate,
    );

    return NextResponse.json(stats);
  } catch (error) {
    logger.error("Page stats endpoint failed", { meta: { error } });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
