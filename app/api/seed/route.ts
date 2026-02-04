import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { ObjectId } from "mongodb"
import { hashPassword, generateToken, hashToken } from "@/lib/auth"

const MOCK_DOMAINS = [
  "github.com",
  "stackoverflow.com",
  "youtube.com",
  "reddit.com",
  "twitter.com",
  "linkedin.com",
  "medium.com",
  "dev.to",
  "vercel.com",
  "nextjs.org",
  "react.dev",
  "tailwindcss.com",
]

const MOCK_URLS = {
  "github.com": [
    "/facebook/react",
    "/vercel/next.js",
    "/microsoft/vscode",
    "/pulls",
    "/issues",
  ],
  "stackoverflow.com": [
    "/questions/tagged/javascript",
    "/questions/tagged/react",
    "/questions/tagged/typescript",
    "/questions/tagged/nextjs",
  ],
  "youtube.com": [
    "/watch?v=dQw4w9WgXcQ",
    "/watch?v=FKTxC9pl-WM",
    "/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf",
  ],
  "reddit.com": [
    "/r/programming",
    "/r/webdev",
    "/r/reactjs",
    "/r/javascript",
  ],
  "twitter.com": ["/home", "/notifications", "/explore", "/messages"],
  "linkedin.com": ["/feed", "/jobs", "/mynetwork", "/messaging"],
  "medium.com": [
    "/@dan_abramov/making-sense-of-react-hooks",
    "/javascript-in-plain-english",
  ],
  "dev.to": ["/t/javascript", "/t/webdev", "/t/react", "/t/typescript"],
  "vercel.com": ["/docs", "/templates", "/pricing", "/dashboard"],
  "nextjs.org": ["/docs", "/learn", "/showcase", "/blog"],
  "react.dev": ["/learn", "/reference", "/community", "/blog"],
  "tailwindcss.com": ["/docs", "/components", "/examples", "/resources"],
}

const MOCK_TITLES = {
  "github.com": [
    "React - A JavaScript library for building user interfaces",
    "Next.js by Vercel - The React Framework",
    "Visual Studio Code - Code Editing. Redefined",
    "Pull Requests - GitHub",
    "Issues - GitHub",
  ],
  "stackoverflow.com": [
    "Newest JavaScript Questions - Stack Overflow",
    "Newest React Questions - Stack Overflow",
    "Newest TypeScript Questions - Stack Overflow",
    "Newest Next.js Questions - Stack Overflow",
  ],
  "youtube.com": [
    "Rick Astley - Never Gonna Give You Up - YouTube",
    "JavaScript Tutorial for Beginners - YouTube",
    "React Full Course - YouTube",
  ],
  "reddit.com": [
    "r/programming - Reddit",
    "r/webdev - Reddit",
    "r/reactjs - Reddit",
    "r/javascript - Reddit",
  ],
  "twitter.com": ["Home / Twitter", "Notifications / Twitter", "Explore / Twitter", "Messages / Twitter"],
  "linkedin.com": ["Feed | LinkedIn", "Jobs | LinkedIn", "My Network | LinkedIn", "Messaging | LinkedIn"],
  "medium.com": [
    "Making Sense of React Hooks - Dan Abramov",
    "JavaScript in Plain English - Medium",
  ],
  "dev.to": [
    "JavaScript - DEV Community",
    "Web Development - DEV Community",
    "React - DEV Community",
    "TypeScript - DEV Community",
  ],
  "vercel.com": ["Documentation - Vercel", "Templates - Vercel", "Pricing - Vercel", "Dashboard - Vercel"],
  "nextjs.org": ["Documentation - Next.js", "Learn Next.js", "Showcase - Next.js", "Blog - Next.js"],
  "react.dev": ["Learn React", "React Reference", "React Community", "React Blog"],
  "tailwindcss.com": ["Documentation - Tailwind CSS", "Components - Tailwind CSS", "Examples - Tailwind CSS", "Resources - Tailwind CSS"],
}

function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

function getRandomDuration(): number {
  // Random duration between 30 seconds and 30 minutes
  const durations = [30, 60, 120, 180, 300, 600, 900, 1200, 1800]
  return getRandomItem(durations)
}

function getRandomTimestamp(daysAgo: number): Date {
  const now = new Date()
  const start = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
  const randomTime = start.getTime() + Math.random() * (now.getTime() - start.getTime())
  return new Date(randomTime)
}

async function seedData() {
  try {
    const db = await getDb()
    
    // Create a demo user
    const email = "demo@echo.dev"
    const password = "demo1234"
    
    // Check if user already exists
    let user = await db.collection("users").findOne({ email })
    
    if (!user) {
      const apiToken = generateToken()
      const hashedApiToken = hashToken(apiToken)
      
      user = {
        _id: new ObjectId(),
        email,
        password: await hashPassword(password),
        apiToken: hashedApiToken,
        createdAt: new Date(),
      }
      
      await db.collection("users").insertOne(user)
    }
    
    const userId = user._id
    
    // Create mock projects
    const projects = [
      {
        _id: new ObjectId(),
        userId,
        name: "Open Source",
        color: "#22c55e",
        rules: [
          { type: "domain", value: "github.com" },
          { type: "domain", value: "stackoverflow.com" },
        ],
        createdAt: new Date(),
      },
      {
        _id: new ObjectId(),
        userId,
        name: "Learning",
        color: "#3b82f6",
        rules: [
          { type: "domain", value: "youtube.com" },
          { type: "domain", value: "medium.com" },
          { type: "domain", value: "dev.to" },
        ],
        createdAt: new Date(),
      },
      {
        _id: new ObjectId(),
        userId,
        name: "Documentation",
        color: "#8b5cf6",
        rules: [
          { type: "domain", value: "nextjs.org" },
          { type: "domain", value: "react.dev" },
          { type: "domain", value: "tailwindcss.com" },
          { type: "domain", value: "vercel.com" },
        ],
        createdAt: new Date(),
      },
      {
        _id: new ObjectId(),
        userId,
        name: "Social",
        color: "#ec4899",
        rules: [
          { type: "domain", value: "twitter.com" },
          { type: "domain", value: "linkedin.com" },
          { type: "domain", value: "reddit.com" },
        ],
        createdAt: new Date(),
      },
    ]
    
    await db.collection("projects").deleteMany({ userId })
    await db.collection("projects").insertMany(projects)
    
    // Generate mock activity logs for the last 7 days
    const activityLogs = []
    const entries = []
    
    for (let day = 0; day < 7; day++) {
      // Generate 20-40 logs per day
      const logsPerDay = Math.floor(Math.random() * 20) + 20
      
      for (let i = 0; i < logsPerDay; i++) {
        const domain = getRandomItem(MOCK_DOMAINS)
        const urls = MOCK_URLS[domain as keyof typeof MOCK_URLS] || ["/"]
        const titles = MOCK_TITLES[domain as keyof typeof MOCK_TITLES] || ["Page Title"]
        const path = getRandomItem(urls)
        const url = `https://${domain}${path}`
        const title = getRandomItem(titles)
        const duration = getRandomDuration()
        const timestamp = getRandomTimestamp(day)
        
        activityLogs.push({
          userId,
          url,
          domain,
          title,
          duration,
          timestamp,
          createdAt: new Date(),
        })
        
        entries.push({
          userId,
          url,
          domain,
          title,
          firstSeen: timestamp,
          lastSeen: timestamp,
          totalDuration: duration,
          visitCount: 1,
        })
      }
    }
    
    // Clear existing data
    await db.collection("activity_logs").deleteMany({ userId })
    await db.collection("page_entries").deleteMany({ userId })
    
    // Insert mock data
    await db.collection("activity_logs").insertMany(activityLogs)
    
    // Aggregate page entries (combine duplicates)
    const pageMap = new Map<string, typeof entries[0]>()
    
    for (const entry of entries) {
      const key = `${entry.url}`
      if (pageMap.has(key)) {
        const existing = pageMap.get(key)!
        existing.totalDuration += entry.totalDuration
        existing.visitCount += 1
        existing.lastSeen = entry.lastSeen > existing.lastSeen ? entry.lastSeen : existing.lastSeen
      } else {
        pageMap.set(key, entry)
      }
    }
    
    await db.collection("page_entries").insertMany(Array.from(pageMap.values()))
    
    return {
      success: true,
      message: "Mock data seeded successfully",
      stats: {
        projects: projects.length,
        activityLogs: activityLogs.length,
        pageEntries: pageMap.size,
      },
      credentials: {
        email,
        password,
      },
    }
  } catch (error) {
    console.error("Seed error:", error)
    throw error
  }
}

export async function GET() {
  try {
    const result = await seedData()
    return NextResponse.json(result)
  } catch (error) {
    console.error("Seed error:", error)
    return NextResponse.json(
      { error: "Failed to seed data" },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    const result = await seedData()
    return NextResponse.json(result)
  } catch (error) {
    console.error("Seed error:", error)
    return NextResponse.json(
      { error: "Failed to seed data" },
      { status: 500 }
    )
  }
}
