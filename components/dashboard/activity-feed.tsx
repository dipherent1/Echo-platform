"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Globe, Clock, ExternalLink, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from "lucide-react"
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

interface ActivityFeedProps {
  data: Activity[]
}

const ITEMS_PER_PAGE = 10

export function ActivityFeed({ data }: ActivityFeedProps) {
  const [sortBy, setSortBy] = useState<"time" | "duration">("time")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [currentPage, setCurrentPage] = useState(1)

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

  return (
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
        <div className="space-y-3 min-h-[400px]">
          {paginatedData.map((activity) => {
            const displayTitle = activity.page?.title || activity.page?.url || activity.domain
            const displayUrl = activity.page?.url || `http://${activity.domain}`
            
            return (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
              >
                <div className="flex-shrink-0 mt-1">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-foreground truncate">
                      {displayTitle}
                    </p>
                    <a
                      href={displayUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
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
  )
}
