import { NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getDb } from "@/lib/db"
import { logger } from "@/lib/logger"
import type { Page, Project, ActivityLog } from "@/lib/types"

// Mock websites data - realistic browsing patterns
const mockSites = [
  // Development
  { domain: "github.com", paths: ["/pulls", "/issues", "/notifications", "/explore", "/settings"], titles: ["Pull Requests", "Issues", "Notifications", "Explore GitHub", "Settings"], category: "development" },
  { domain: "stackoverflow.com", paths: ["/questions", "/questions/tagged/react", "/questions/tagged/typescript", "/questions/tagged/nextjs"], titles: ["Stack Overflow", "React Questions", "TypeScript Questions", "Next.js Questions"], category: "development" },
  { domain: "vercel.com", paths: ["/dashboard", "/docs", "/blog", "/analytics"], titles: ["Vercel Dashboard", "Vercel Documentation", "Vercel Blog", "Analytics"], category: "development" },
  { domain: "nextjs.org", paths: ["/docs", "/docs/app/building-your-application", "/docs/api-reference", "/blog"], titles: ["Next.js Docs", "Building Your Application", "API Reference", "Next.js Blog"], category: "development" },
  { domain: "tailwindcss.com", paths: ["/docs", "/docs/installation", "/docs/utility-first", "/blog"], titles: ["Tailwind CSS", "Installation", "Utility-First Fundamentals", "Tailwind Blog"], category: "development" },
  { domain: "localhost:3000", paths: ["/", "/dashboard", "/settings", "/api-docs"], titles: ["Local Dev", "Dashboard", "Settings", "API Documentation"], category: "development" },
  
  // Communication
  { domain: "mail.google.com", paths: ["/mail/u/0/#inbox", "/mail/u/0/#starred", "/mail/u/0/#sent"], titles: ["Inbox - Gmail", "Starred - Gmail", "Sent - Gmail"], category: "communication" },
  { domain: "slack.com", paths: ["/client", "/messages", "/threads"], titles: ["Slack", "Messages", "Threads"], category: "communication" },
  { domain: "discord.com", paths: ["/channels/@me", "/channels/server"], titles: ["Discord", "Server Chat"], category: "communication" },
  
  // Productivity
  { domain: "notion.so", paths: ["/", "/workspace", "/notes", "/tasks"], titles: ["Notion", "Workspace", "Notes", "Tasks"], category: "productivity" },
  { domain: "linear.app", paths: ["/team/issues", "/team/projects", "/team/cycles"], titles: ["Linear Issues", "Projects", "Cycles"], category: "productivity" },
  { domain: "figma.com", paths: ["/files", "/design/project", "/prototype"], titles: ["Figma Files", "Design Project", "Prototype"], category: "productivity" },
  
  // Learning
  { domain: "youtube.com", paths: ["/watch?v=abc123", "/playlist", "/@channel"], titles: ["TypeScript Tutorial", "React Playlist", "Dev Channel"], category: "learning" },
  { domain: "udemy.com", paths: ["/course/react-complete", "/course/nextjs-complete"], titles: ["Complete React Course", "Next.js Complete Guide"], category: "learning" },
  { domain: "medium.com", paths: ["/@author/article", "/topic/programming"], titles: ["Tech Article", "Programming Topic"], category: "learning" },
  
  // Social (distraction)
  { domain: "twitter.com", paths: ["/home", "/notifications", "/explore"], titles: ["Twitter Home", "Notifications", "Explore"], category: "social" },
  { domain: "reddit.com", paths: ["/r/programming", "/r/webdev", "/r/reactjs"], titles: ["r/programming", "r/webdev", "r/reactjs"], category: "social" },
  { domain: "news.ycombinator.com", paths: ["/", "/newest", "/ask"], titles: ["Hacker News", "New", "Ask HN"], category: "social" },
]

// Project definitions
const projectDefinitions = [
  { name: "Echo Development", color: "#22c55e", rules: [{ type: "domain" as const, value: "localhost:3000" }, { type: "url_contains" as const, value: "echo" }] },
  { name: "Learning", color: "#3b82f6", rules: [{ type: "domain" as const, value: "youtube.com" }, { type: "domain" as const, value: "udemy.com" }, { type: "domain" as const, value: "medium.com" }] },
  { name: "Communication", color: "#f59e0b", rules: [{ type: "domain" as const, value: "slack.com" }, { type: "domain" as const, value: "discord.com" }, { type: "domain" as const, value: "mail.google.com" }] },
  { name: "Open Source", color: "#8b5cf6", rules: [{ type: "domain" as const, value: "github.com" }] },
  { name: "Documentation", color: "#06b6d4", rules: [{ type: "domain" as const, value: "nextjs.org" }, { type: "domain" as const, value: "tailwindcss.com" }, { type: "domain" as const, value: "vercel.com" }] },
]

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Generate weighted random site based on time of day
function getWeightedSite(hour: number): typeof mockSites[0] {
  const weights: Record<string, number> = {}
  
  if (hour >= 9 && hour < 18) {
    weights.development = 40
    weights.productivity = 25
    weights.communication = 20
    weights.learning = 10
    weights.social = 5
  } else if (hour >= 18 && hour < 23) {
    weights.development = 20
    weights.learning = 30
    weights.social = 30
    weights.productivity = 10
    weights.communication = 10
  } else {
    weights.social = 40
    weights.learning = 30
    weights.development = 20
    weights.productivity = 5
    weights.communication = 5
  }
  
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0)
  let random = Math.random() * totalWeight
  
  for (const category of Object.keys(weights)) {
    random -= weights[category]
    if (random <= 0) {
      const categorySites = mockSites.filter(s => s.category === category)
      return getRandomElement(categorySites)
    }
  }
  
  return getRandomElement(mockSites)
}

async function seedForUser(userId: ObjectId) {
  const db = await getDb()

  // Clear existing data for this user
  await db.collection("pages").deleteMany({ userId })
  await db.collection("projects").deleteMany({ userId })
  await db.collection("activity_logs").deleteMany({ "metadata.userId": userId })

  logger.info("Cleared existing data for seed", { userId: userId.toString() })

  // Create projects
  const projectMap = new Map<string, ObjectId>()
  const projectDocs: Project[] = []
  
  for (const proj of projectDefinitions) {
    const projectId = new ObjectId()
    projectMap.set(proj.name, projectId)
    projectDocs.push({
      _id: projectId,
      userId,
      name: proj.name,
      color: proj.color,
      rules: proj.rules,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }
  
  await db.collection<Project>("projects").insertMany(projectDocs)
  logger.info("Created projects", { count: projectDocs.length })

  // Create pages and activity logs
  const pageMap = new Map<string, ObjectId>()
  const pageDocs: Page[] = []
  const activityDocs: ActivityLog[] = []

  const now = new Date()
  const daysToGenerate = 14

  for (let dayOffset = 0; dayOffset < daysToGenerate; dayOffset++) {
    const date = new Date(now)
    date.setDate(date.getDate() - dayOffset)
    
    const isWeekend = date.getDay() === 0 || date.getDay() === 6
    const sessionsPerDay = isWeekend ? getRandomInt(10, 30) : getRandomInt(30, 60)
    
    for (let session = 0; session < sessionsPerDay; session++) {
      let hour: number
      const rand = Math.random()
      if (rand < 0.1) {
        hour = getRandomInt(0, 8)
      } else if (rand < 0.8) {
        hour = getRandomInt(9, 18)
      } else {
        hour = getRandomInt(19, 23)
      }
      
      const minute = getRandomInt(0, 59)
      const timestamp = new Date(date)
      timestamp.setHours(hour, minute, getRandomInt(0, 59), 0)
      
      const site = getWeightedSite(hour)
      const pathIndex = getRandomInt(0, site.paths.length - 1)
      const url = `https://${site.domain}${site.paths[pathIndex]}`
      const title = site.titles[pathIndex]
      
      let pageId = pageMap.get(url)
      if (!pageId) {
        pageId = new ObjectId()
        pageMap.set(url, pageId)
        
        const firstSeen = new Date(now)
        firstSeen.setDate(firstSeen.getDate() - getRandomInt(dayOffset, daysToGenerate))
        
        pageDocs.push({
          _id: pageId,
          userId,
          url,
          domain: site.domain,
          title,
          description: null,
          firstSeenAt: firstSeen,
          lastSeenAt: timestamp,
          ai: {
            productivityLabel: site.category === "social" ? "distraction" : site.category === "development" ? "productive" : "neutral",
            confidence: Math.random() * 0.3 + 0.7,
            embedding: null,
          },
        })
      }
      
      let projectId: ObjectId | null = null
      for (const [projName, projId] of projectMap) {
        const proj = projectDefinitions.find(p => p.name === projName)
        if (proj) {
          const matches = proj.rules.some(rule => {
            if (rule.type === "domain") return site.domain === rule.value
            if (rule.type === "url_contains") return url.includes(rule.value)
            return false
          })
          if (matches) {
            projectId = projId
            break
          }
        }
      }
      
      const duration = getRandomInt(30, 1800)
      
      activityDocs.push({
        _id: new ObjectId(),
        timestamp,
        duration,
        pageId,
        metadata: {
          userId,
          domain: site.domain,
          projectId,
          source: {
            type: "extension",
            deviceName: getRandomElement(["MacBook Pro", "Windows Desktop", "Linux Laptop"]),
            clientId: `client_${getRandomInt(1000, 9999)}`,
          },
        },
      })
    }
  }

  if (pageDocs.length > 0) {
    await db.collection<Page>("pages").insertMany(pageDocs)
    logger.info("Created pages", { count: pageDocs.length })
  }

  if (activityDocs.length > 0) {
    await db.collection<ActivityLog>("activity_logs").insertMany(activityDocs)
    logger.info("Created activity logs", { count: activityDocs.length })
  }

  return {
    projects: projectDocs.length,
    pages: pageDocs.length,
    activityLogs: activityDocs.length,
    daysGenerated: daysToGenerate,
  }
}

// GET /api/seed?email=user@example.com - Seeds data for the given user email
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get("email")
    
    if (!email) {
      return NextResponse.json({ 
        error: "Missing email parameter", 
        usage: "GET /api/seed?email=user@example.com" 
      }, { status: 400 })
    }

    const db = await getDb()
    // Query by username since email is stored in username field
    const user = await db.collection("users").findOne({ username: email })
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const stats = await seedForUser(user._id)

    return NextResponse.json({
      success: true,
      user: { username: user.username },
      stats,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Seed failed"
    logger.error("Seed failed", { meta: { error: message } })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
