"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import useSWR, { mutate } from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Globe, Clock, ExternalLink, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Plus, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatDistanceToNow } from "date-fns"

interface Activity {
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
}

interface Project {
  id: string
  name: string
  color: string
}

interface ActivityFeedProps {
  data: Activity[]
}

const ITEMS_PER_PAGE = 10

export function ActivityFeed({ data }: ActivityFeedProps) {
  const { token } = useAuth()
  const [sortBy, setSortBy] = useState<"time" | "duration">("time")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [assigning, setAssigning] = useState(false)

  const fetcher = async (url: string) => {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) throw new Error("Failed to fetch")
    return res.json()
  }

  const { data: projectsData } = useSWR<{ projects: Project[] }>(
    token && selectedActivity ? "/api/projects" : null,
    fetcher
  )

  if (!data || data.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[200px] items-center justify-center">
          <p className="text-muted-foreground">No recent activity</p>
        </CardContent>
      </Card>
    )
  }

  const sortedData = [...data].sort((a, b) => {
    const multiplier = sortOrder === "asc" ? 1 : -1
    if (sortBy === "time") {
      return (new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) * multiplier
    }
    return (b.duration - a.duration) * multiplier
  })

  const totalPages = Math.ceil(sortedData.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedData = sortedData.slice(startIndex, endIndex)

  const toggleSort = (newSortBy: "time" | "duration") => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(newSortBy)
      setSortOrder("desc")
    }
    setCurrentPage(1)
  }

  const assignToProject = async (projectId: string) => {
    if (!selectedActivity || !token) return

    setAssigning(true)
    try {
      const url = selectedActivity.page?.url || `http://${selectedActivity.domain}`
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          addRule: { type: "manual_url", value: url },
        }),
      })

      if (res.ok) {
        mutate("/api/projects")
        setSelectedActivity(null)
      }
    } finally {
      setAssigning(false)
    }
  }

  return (
    <>
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-foreground">Recent Activity</CardTitle>
          <div className="flex gap-2">
            <Button
              variant={sortBy === "time" ? "secondary" : "outline"}
              size="sm"
              onClick={() => toggleSort("time")}
              className="gap-2"
            >
              {sortBy === "time" && (sortOrder === "desc" ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />)}
              Last Seen
            </Button>
            <Button
              variant={sortBy === "duration" ? "secondary" : "outline"}
              size="sm"
              onClick={() => toggleSort("duration")}
              className="gap-2"
            >
              {sortBy === "duration" && (sortOrder === "desc" ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />)}
              Time Spent
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            {paginatedData.map((activity) => {
              const displayTitle = activity.page?.title || activity.page?.url || activity.domain
              const displayUrl = activity.page?.url || `http://${activity.domain}`
              
              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors group"
                >
                  <div className="flex-shrink-0 mt-1">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-foreground truncate">
                        {displayTitle}
                      </p>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <a
                          href={displayUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedActivity(activity)}
                          className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    {activity.page?.title && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {displayUrl}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{activity.durationFormatted}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages} ({sortedData.length} total)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedActivity} onOpenChange={(open) => !open && setSelectedActivity(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Add to Project</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {selectedActivity && (selectedActivity.page?.title || selectedActivity.domain)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            {projectsData?.projects && projectsData.projects.length > 0 ? (
              projectsData.projects.map((project) => (
                <Button
                  key={project.id}
                  variant="outline"
                  className="w-full justify-start gap-3 bg-transparent"
                  onClick={() => assignToProject(project.id)}
                  disabled={assigning}
                >
                  <div
                    className="h-3 w-3 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: project.color }}
                  />
                  <span className="flex-1 text-left">{project.name}</span>
                  {assigning && <Loader2 className="h-4 w-4 animate-spin" />}
                </Button>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No projects yet. Create one in the Projects section.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
