import { NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/auth"
import { createProject, getProjects } from "@/lib/services/project-service"
import { logger } from "@/lib/logger"
import type { ProjectRule } from "@/lib/types"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const user = await authenticateRequest(authHeader)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const projects = await getProjects(user._id)

    logger.info("Projects fetched", {
      userId: user._id.toString(),
      endpoint: "/api/projects",
      meta: { count: projects.length },
    })

    return NextResponse.json({
      projects: projects.map((p) => ({
        id: p._id.toString(),
        name: p.name,
        color: p.color,
        rules: p.rules,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch projects"
    logger.error("Projects GET failed", { meta: { error: message } })

    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const user = await authenticateRequest(authHeader)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, color, rules } = body

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 })
    }

    if (!color || typeof color !== "string") {
      return NextResponse.json({ error: "Project color is required" }, { status: 400 })
    }

    // Validate rules if provided
    const validatedRules: ProjectRule[] = []
    if (rules && Array.isArray(rules)) {
      for (const rule of rules) {
        if (
          rule.type &&
          (rule.type === "domain" || rule.type === "url_contains") &&
          rule.value &&
          typeof rule.value === "string"
        ) {
          validatedRules.push({ type: rule.type, value: rule.value })
        }
      }
    }

    const project = await createProject(user._id, name, color, validatedRules)

    logger.info("Project created", {
      userId: user._id.toString(),
      endpoint: "/api/projects",
      meta: { projectId: project._id.toString(), name },
    })

    return NextResponse.json(
      {
        success: true,
        project: {
          id: project._id.toString(),
          name: project.name,
          color: project.color,
          rules: project.rules,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create project"
    logger.error("Projects POST failed", { meta: { error: message } })

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
