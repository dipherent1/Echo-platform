"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Globe, Clock, ExternalLink, ArrowUpDown } from "lucide-react"
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

export function ActivityFeed({ data }: ActivityFeedProps) {
  const [sortBy, setSortBy] = useState<"time" | "duration">("time")

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
    if (sortBy === "time") {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    }
    return b.duration - a.duration
  })

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-foreground">Recent Activity</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSortBy(sortBy === "time" ? "duration" : "time")}
          className="gap-2"
        >
          <ArrowUpDown className="h-3 w-3" />
          {sortBy === "time" ? "Last Seen" : "Time Spent"}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
          {sortedData.map((activity) => {
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
      </CardContent>
    </Card>
  )
}
