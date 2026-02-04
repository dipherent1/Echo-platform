import { NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/auth"
import { createActivityLog } from "@/lib/services/activity-service"
import { createProject } from "@/lib/services/project-service"
import { logger } from "@/lib/logger"

const MOCK_ACTIVITIES = [
  // Coding activities
  { url: "https://github.com/user/repo", title: "GitHub - user/repo", domain: "github.com" },
  { url: "https://stackoverflow.com/questions/123", title: "How to fix React hooks - Stack Overflow", domain: "stackoverflow.com" },
  { url: "https://react.dev/learn", title: "Quick Start - React", domain: "react.dev" },
  { url: "https://nextjs.org/docs", title: "Getting Started - Next.js", domain: "nextjs.org" },
  { url: "https://tailwindcss.com/docs", title: "Installation - Tailwind CSS", domain: "tailwindcss.com" },
  { url: "https://vercel.com/docs", title: "Vercel Documentation", domain: "vercel.com" },
  { url: "https://mongodb.com/docs", title: "MongoDB Documentation", domain: "mongodb.com" },
  
  // Work/Productivity
  { url: "https://notion.so/workspace", title: "Project Planning - Notion", domain: "notion.so" },
  { url: "https://linear.app/issues", title: "Issues - Linear", domain: "linear.app" },
  { url: "https://figma.com/file/abc", title: "Design System - Figma", domain: "figma.com" },
  { url: "https://slack.com/workspace", title: "Team Chat - Slack", domain: "slack.com" },
  
  // Learning
  { url: "https://youtube.com/watch?v=xyz", title: "Advanced TypeScript Tutorial", domain: "youtube.com" },
  { url: "https://dev.to/article", title: "Building Scalable APIs - DEV Community", domain: "dev.to" },
  { url: "https://medium.com/article", title: "System Design Patterns", domain: "medium.com" },
  
  // Social/Break
  { url: "https://twitter.com/home", title: "Home / X", domain: "twitter.com" },
  { url: "https://reddit.com/r/programming", title: "r/programming - Reddit", domain: "reddit.com" },
]

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const user = await authenticateRequest(authHeader)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    logger.info("Starting seed data generation", { userId: user._id.toString() })

    // Create projects
    const projects = await Promise.all([
      createProject(user._id, {
        name: "Echo Platform",
        color: "#10b981",
        rules: [
          { type: "domain", value: "github.com", operator: "equals" },
          { type: "url", value: "echo", operator: "contains" },
        ],
      }),
      createProject(user._id, {
        name: "Learning",
        color: "#3b82f6",
        rules: [
          { type: "domain", value: "youtube.com", operator: "equals" },
          { type: "domain", value: "dev.to", operator: "equals" },
          { type: "url", value: "tutorial", operator: "contains" },
        ],
      }),
      createProject(user._id, {
        name: "Documentation",
        color: "#8b5cf6",
        rules: [
          { type: "url", value: "docs", operator: "contains" },
          { type: "domain", value: "react.dev", operator: "equals" },
        ],
      }),
    ])

    // Generate activity logs for the past 7 days
    const now = new Date()
    const logsCreated = []

    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const currentDay = new Date(now)
      currentDay.setDate(currentDay.getDate() - dayOffset)
      
      // Generate 15-30 activities per day
      const activitiesPerDay = 15 + Math.floor(Math.random() * 15)
      
      for (let i = 0; i < activitiesPerDay; i++) {
        const activity = MOCK_ACTIVITIES[Math.floor(Math.random() * MOCK_ACTIVITIES.length)]
        
        // Random hour between 9 AM and 11 PM
        const hour = 9 + Math.floor(Math.random() * 14)
        const minute = Math.floor(Math.random() * 60)
        
        const timestamp = new Date(currentDay)
        timestamp.setHours(hour, minute, 0, 0)
        
        // Duration between 30 seconds and 45 minutes
        const duration = 30 + Math.floor(Math.random() * 2670)
        
        try {
          const log = await createActivityLog(user._id, {
            url: activity.url,
            title: activity.title,
            duration,
            timestamp: timestamp.toISOString(),
          })
          logsCreated.push(log)
        } catch (error) {
          // Continue if duplicate
          console.log(`[v0] Skipping duplicate: ${activity.url}`)
        }
      }
    }

    logger.info("Seed data generation completed", {
      userId: user._id.toString(),
      projectsCreated: projects.length,
      logsCreated: logsCreated.length,
    })

    return NextResponse.json({
      success: true,
      message: "Mock data created successfully",
      stats: {
        projects: projects.length,
        activityLogs: logsCreated.length,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to seed data"
    logger.error("Seed endpoint failed", { meta: { error: message } })

    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const user = await authenticateRequest(authHeader)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    logger.info("Starting seed data generation", { userId: user._id.toString() })

    // Create projects
    const projects = await Promise.all([
      createProject(user._id, {
        name: "Echo Platform",
        color: "#10b981",
        rules: [
          { type: "domain", value: "github.com", operator: "equals" },
          { type: "url", value: "echo", operator: "contains" },
        ],
      }),
      createProject(user._id, {
        name: "Learning",
        color: "#3b82f6",
        rules: [
          { type: "domain", value: "youtube.com", operator: "equals" },
          { type: "domain", value: "dev.to", operator: "equals" },
          { type: "url", value: "tutorial", operator: "contains" },
        ],
      }),
      createProject(user._id, {
        name: "Documentation",
        color: "#8b5cf6",
        rules: [
          { type: "url", value: "docs", operator: "contains" },
          { type: "domain", value: "react.dev", operator: "equals" },
        ],
      }),
    ])

    // Generate activity logs for the past 7 days
    const now = new Date()
    const logsCreated = []

    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const currentDay = new Date(now)
      currentDay.setDate(currentDay.getDate() - dayOffset)
      
      // Generate 15-30 activities per day
      const activitiesPerDay = 15 + Math.floor(Math.random() * 15)
      
      for (let i = 0; i < activitiesPerDay; i++) {
        const activity = MOCK_ACTIVITIES[Math.floor(Math.random() * MOCK_ACTIVITIES.length)]
        
        // Random hour between 9 AM and 11 PM
        const hour = 9 + Math.floor(Math.random() * 14)
        const minute = Math.floor(Math.random() * 60)
        
        const timestamp = new Date(currentDay)
        timestamp.setHours(hour, minute, 0, 0)
        
        // Duration between 30 seconds and 45 minutes
        const duration = 30 + Math.floor(Math.random() * 2670)
        
        try {
          const log = await createActivityLog(user._id, {
            url: activity.url,
            title: activity.title,
            duration,
            timestamp: timestamp.toISOString(),
          })
          logsCreated.push(log)
        } catch (error) {
          // Continue if duplicate
          console.log(`[v0] Skipping duplicate: ${activity.url}`)
        }
      }
    }

    logger.info("Seed data generation completed", {
      userId: user._id.toString(),
      projectsCreated: projects.length,
      logsCreated: logsCreated.length,
    })

    return NextResponse.json({
      success: true,
      message: "Mock data created successfully",
      stats: {
        projects: projects.length,
        activityLogs: logsCreated.length,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to seed data"
    logger.error("Seed endpoint failed", { meta: { error: message } })

    return NextResponse.json({ error: message }, { status: 500 })
  }
