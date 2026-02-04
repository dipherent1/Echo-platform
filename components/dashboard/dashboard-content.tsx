"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import useSWR from "swr"
import { Sidebar } from "./sidebar"
import { DashboardHeader } from "./header"
import { TimeRangeSelector } from "./time-range-selector"
import { StatsCard } from "./stats-card"
import { ProjectChart } from "./project-chart"
import { DomainChart } from "./domain-chart"
import { ActivityHeatmap } from "./activity-heatmap"
import { ActivityFeed } from "./activity-feed"
import { ProjectManager } from "./project-manager"
import { TokenView } from "./token-view"
import { PagesView } from "./pages-view"
import { Clock, Globe, FolderOpen, FileText, Loader2 } from "lucide-react"

interface Stats {
  range: string
  summary: {
    totalDuration: number
    totalDurationFormatted: string
  }
  byProject: Array<{
    projectId: string | null
    projectName: string
    color: string
    totalDuration: number
    totalDurationFormatted: string
  }>
  byDomain: Array<{
    domain: string
    totalDuration: number
    totalDurationFormatted: string
  }>
  heatmap: Array<{
    hour: number
    dayOfWeek: number
    totalDuration: number
  }>
  topPages: Array<{
    pageId: string
    title: string
    url: string
    domain: string
    totalDuration: number
    totalDurationFormatted: string
  }>
  recentActivity: Array<{
    id: string
    timestamp: string
    duration: number
    durationFormatted: string
    domain: string
    projectId: string | null
    page: {
      title: string
      url: string
      domain: string
    } | null
  }>
}

export function DashboardContent() {
  const { token } = useAuth()
  const [timeRange, setTimeRange] = useState("week")
  const [currentView, setCurrentView] = useState("dashboard")

  const fetcher = async (url: string) => {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) throw new Error("Failed to fetch stats")
    return res.json()
  }

  const { data: stats, error, isLoading } = useSWR<Stats>(
    token ? `/api/stats?range=${timeRange}` : null,
    fetcher,
    { refreshInterval: 60000 }
  )

  const projectCount = stats?.byProject.filter((p) => p.projectId).length || 0
  const domainCount = stats?.byDomain.length || 0
  const pageCount = stats?.topPages.length || 0

  const renderDashboard = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-[calc(100vh-56px)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-[calc(100vh-56px)]">
          <p className="text-destructive">Failed to load dashboard data</p>
        </div>
      )
    }

    return (
      <>
        {/* Header with time range */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Track your productivity and browsing habits
            </p>
          </div>
          <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
        </div>

        {/* Stats cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <StatsCard
            title="Total Time"
            value={stats?.summary.totalDurationFormatted || "0m"}
            description={`${timeRange === "today" ? "Today" : timeRange === "week" ? "This week" : "This month"}`}
            icon={Clock}
          />
          <StatsCard
            title="Projects"
            value={projectCount.toString()}
            description="Active projects"
            icon={FolderOpen}
          />
          <StatsCard
            title="Domains"
            value={domainCount.toString()}
            description="Unique domains"
            icon={Globe}
          />
          <StatsCard
            title="Pages"
            value={pageCount.toString()}
            description="Top pages tracked"
            icon={FileText}
          />
        </div>

        {/* Charts row */}
        <div className="grid gap-4 lg:grid-cols-2 mb-6">
          <ActivityFeed data={stats?.recentActivity || []} />
          <DomainChart data={stats?.byDomain || []} />
        </div>

        {/* Heatmap */}
        <div className="mb-6">
          <ActivityHeatmap data={stats?.heatmap || []} />
        </div>

        {/* Project chart */}
        <div className="mb-6">
          <ProjectChart data={stats?.byProject || []} />
        </div>
      </>
    )
  }

  const renderContent = () => {
    switch (currentView) {
      case "projects":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Projects</h2>
              <p className="text-muted-foreground">
                Manage your projects and auto-categorization rules.
              </p>
            </div>
            <ProjectManager />
          </div>
        )
      case "pages":
        return <PagesView />
      case "token":
        return <TokenView />
      case "settings":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Settings</h2>
              <p className="text-muted-foreground">
                Configure your Echo preferences.
              </p>
            </div>
            <p className="text-muted-foreground">Settings coming soon...</p>
          </div>
        )
      default:
        return renderDashboard()
    }
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  )
}
