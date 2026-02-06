import { ToolLoopAgent, tool, stepCountIs } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { createAgentUIStreamResponse } from "ai";
import { ObjectId } from "mongodb";
import {
  getTodaysActivity,
  getThisWeeksActivity,
} from "@/lib/repository/activity-repo";
import { authenticateRequest } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

const echoAgent = new ToolLoopAgent({
  model: google("gemini-2.5-flash-lite"),
  stopWhen: stepCountIs(5),
  callOptionsSchema: z.object({
    userId: z.string(),
  }),

  instructions: `You are an HMI (human-machine interface) agent for the Echo platform with access to database tools.

  Note: the authenticated user's id will be provided to you as a call option named 'userId'.

  Role:
  - Interpret user queries about pages, projects, and activity.
  - Use available tools (for example: getTodaysActivity, getThisWeeksActivity) to fetch data when helpful.
  - When asked about a page, infer the likely page content, purpose, and relevant tags from the page's title and description.

  Behavior and writing style:
  - Provide concise summaries and actionable insights based on title/description and any returned activity data.
  - If you infer content, clearly label those parts as "inferred" and state the assumptions or evidence (title, description, recent activity).
  - Suggest a likely project name or tag when matching evidence exists; include project names and total time spent when available.
  - Ask brief clarifying questions only if the user's query is ambiguous or lacks necessary context.

  Output format:
  - Prefer short Markdown summaries with headers and bullets.
  - Include data points (e.g., totalDuration, projectName) returned by tools.
  - Do not hallucinate exact content beyond reasonable inference from title/description and available data.
  - If no data is available, explain limitations and offer next steps (e.g., fetch activity, provide more context).
`,

  prepareCall: ({ options, ...settings }) => ({
    ...settings,
    instructions:
      settings.instructions +
      `\nUser context:
- User ID: ${options.userId}

Adjust your response based on the user's account level.`,
  }),

  tools: {
    getTodaysActivity: tool({
      description: "Get today's activity by page for a user (userId string)",
      inputSchema: z.object({ userId: z.string() }),
      execute: async ({ userId }) => {
        const rows = await getTodaysActivity(new ObjectId(userId));
        const serializable = rows.map((r) => ({
          ...r,
          pageId: r.pageId.toString(),
        }));
        return { results: serializable };
      },
    }),
    getThisWeeksActivity: tool({
      description:
        "Get the last 7 days' activity by page for a user (userId string)",
      inputSchema: z.object({ userId: z.string() }),
      execute: async ({ userId }) => {
        const rows = await getThisWeeksActivity(new ObjectId(userId));
        const serializable = rows.map((r) => ({
          ...r,
          pageId: r.pageId.toString(),
        }));
        return { results: serializable };
      },
    }),
  },
});

// In your API route (e.g., app/api/chat/route.ts)

export async function POST(request: Request) {
  const { messages } = await request.json();

  let user: any = null;
  try {
    const authHeader = request.headers.get("authorization");
    user = await authenticateRequest(authHeader);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch pages";
    logger.error("Pages endpoint failed", { meta: { error: message } });

    return NextResponse.json({ error: message }, { status: 500 });
  }

  // extract ObjectId from possible return shapes (direct user doc or findOneAndUpdate result)
  const rawId = (user && (user._id ?? user.value?._id)) || null;
  const userIdStr = rawId ? rawId.toString() : null;

  return createAgentUIStreamResponse({
    agent: echoAgent,
    uiMessages: messages,
    options: {
      userId: userIdStr ?? "",
    },
  });
}
