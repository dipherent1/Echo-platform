import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { getPages, searchPages } from "@/lib/services/page-service";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const user = await authenticateRequest(authHeader);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "20")),
    );
    const sortBy =
      (searchParams.get("sortBy") as "lastSeenAt" | "totalDuration") ||
      "lastSeenAt";
    const sortOrder =
      (searchParams.get("sortOrder") as "asc" | "desc") || "desc";
    const query = searchParams.get("q");

    if (query) {
      // Search doesn't support advanced sorting in this implementation yet,
      // but we could pass it if we updated searchPages too.
      // For now, let's keep search simple or update it if needed.
      // The user asked for "filter to pages view", which implies the main list.
      const result = await searchPages(user._id, query, page, limit);
      return NextResponse.json({
        pages: result.pages.map((p) => ({
          id: p._id.toString(),
          url: p.url,
          domain: p.domain,
          title: p.title,
          description: p.description,
          firstSeenAt: p.firstSeenAt,
          lastSeenAt: p.lastSeenAt,
          totalDuration: p.totalDuration,
        })),
        pagination: {
          page: result.page,
          limit,
          total: result.total,
          totalPages: result.totalPages,
        },
        query,
      });
    }

    const result = await getPages(user._id, page, limit, sortBy, sortOrder);

    logger.info("Pages fetched", {
      userId: user._id.toString(),
      endpoint: "/api/pages",
      meta: { page, limit, total: result.total, sortBy, sortOrder },
    });

    return NextResponse.json({
      pages: result.pages.map((p) => ({
        id: p._id.toString(),
        url: p.url,
        domain: p.domain,
        title: p.title,
        description: p.description,
        firstSeenAt: p.firstSeenAt,
        lastSeenAt: p.lastSeenAt,
        totalDuration: p.totalDuration,
      })),
      pagination: {
        page: result.page,
        limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch pages";
    logger.error("Pages endpoint failed", { meta: { error: message } });

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
