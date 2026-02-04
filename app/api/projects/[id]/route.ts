import { NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { authenticateRequest } from "@/lib/auth"
import { getProjectById, updateProject, deleteProject } from "@/lib/services/project-service"
import { logger } from "@/lib/logger"
import type { ProjectRule } from "@/lib/types"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const authHeader = request.headers.get("authorization")
    const user = await authenticateRequest(authHeader)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 })
    }

    const project = await getProjectById(new ObjectId(id), user._id)

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    return NextResponse.json({
      project: {
        id: project._id.toString(),
        name: project.name,
        color: project.color,
        rules: project.rules,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch project"
    logger.error("Project GET failed", { meta: { error: message } })

    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const authHeader = request.headers.get("authorization")
    const user = await authenticateRequest(authHeader)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 })
    }

    const project = await getProjectById(new ObjectId(id), user._id)
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const body = await request.json()
    const updates: Partial<{ name: string; color: string; rules: ProjectRule[] }> = {}

    // Handle adding a single rule
    if (body.addRule && body.addRule.type && body.addRule.value) {
      const newRule: ProjectRule = {
        type: body.addRule.type as "domain" | "url_contains" | "manual_url",
        value: body.addRule.value,
      }
      updates.rules = [...(project.rules || []), newRule]
    }
    // Handle removing a rule by index
    else if (typeof body.removeRuleIndex === "number") {
      updates.rules = (project.rules || []).filter((_, index) => index !== body.removeRuleIndex)
    }
    // Handle full rules replacement
    else if (body.rules && Array.isArray(body.rules)) {
      updates.rules = body.rules.filter(
        (rule: ProjectRule) =>
          rule.type &&
          (rule.type === "domain" || rule.type === "url_contains" || rule.type === "manual_url") &&
          rule.value &&
          typeof rule.value === "string"
      )
    }

    if (body.name && typeof body.name === "string") {
      updates.name = body.name
    }

    if (body.color && typeof body.color === "string") {
      updates.color = body.color
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid updates provided" }, { status: 400 })
    }

    const updatedProject = await updateProject(new ObjectId(id), user._id, updates)

    if (!updatedProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      project: {
        id: updatedProject._id.toString(),
        name: updatedProject.name,
        color: updatedProject.color,
        rules: updatedProject.rules,
        createdAt: updatedProject.createdAt,
        updatedAt: updatedProject.updatedAt,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update project"
    logger.error("Project PATCH failed", { meta: { error: message } })

    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const authHeader = request.headers.get("authorization")
    const user = await authenticateRequest(authHeader)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 })
    }

    const deleted = await deleteProject(new ObjectId(id), user._id)

    if (!deleted) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Project deleted" })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete project"
    logger.error("Project DELETE failed", { meta: { error: message } })

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
