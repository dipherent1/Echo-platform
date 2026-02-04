"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface HeatmapData {
  hour: number
  dayOfWeek: number
  totalDuration: number
}

interface ActivityHeatmapProps {
  data: HeatmapData[]
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const HOURS = Array.from({ length: 24 }, (_, i) => i)

function getIntensity(value: number, max: number): string {
  if (max === 0 || value === 0) return "bg-muted"
  const ratio = value / max
  if (ratio < 0.2) return "bg-primary/20"
  if (ratio < 0.4) return "bg-primary/40"
  if (ratio < 0.6) return "bg-primary/60"
  if (ratio < 0.8) return "bg-primary/80"
  return "bg-primary"
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

export function ActivityHeatmap({ data }: ActivityHeatmapProps) {
  // Build a map for quick lookup
  const dataMap = new Map<string, number>()
  let maxDuration = 0

  data.forEach((item) => {
    const key = `${item.dayOfWeek}-${item.hour}`
    dataMap.set(key, item.totalDuration)
    if (item.totalDuration > maxDuration) maxDuration = item.totalDuration
  })

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Activity Heatmap</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            {/* Hour labels */}
            <div className="flex mb-1 pl-12">
              {HOURS.filter((h) => h % 3 === 0).map((hour) => (
                <div
                  key={hour}
                  className="text-xs text-muted-foreground"
                  style={{ width: `${100 / 8}%` }}
                >
                  {hour.toString().padStart(2, "0")}:00
                </div>
              ))}
            </div>

            {/* Grid */}
            {DAYS.map((day, dayIndex) => {
              // MongoDB dayOfWeek: 1=Sunday, 2=Monday, etc.
              const mongoDay = dayIndex + 1
              return (
                <div key={day} className="flex items-center gap-1 mb-1">
                  <div className="w-10 text-xs text-muted-foreground text-right pr-2">
                    {day}
                  </div>
                  <div className="flex flex-1 gap-0.5">
                    {HOURS.map((hour) => {
                      const key = `${mongoDay}-${hour}`
                      const duration = dataMap.get(key) || 0
                      return (
                        <div
                          key={hour}
                          className={`h-4 flex-1 rounded-sm ${getIntensity(duration, maxDuration)} transition-colors`}
                          title={`${day} ${hour}:00 - ${formatDuration(duration)}`}
                        />
                      )
                    })}
                  </div>
                </div>
              )
            })}

            {/* Legend */}
            <div className="flex items-center justify-end gap-2 mt-4 pt-2 border-t border-border">
              <span className="text-xs text-muted-foreground">Less</span>
              <div className="flex gap-0.5">
                <div className="h-3 w-3 rounded-sm bg-muted" />
                <div className="h-3 w-3 rounded-sm bg-primary/20" />
                <div className="h-3 w-3 rounded-sm bg-primary/40" />
                <div className="h-3 w-3 rounded-sm bg-primary/60" />
                <div className="h-3 w-3 rounded-sm bg-primary/80" />
                <div className="h-3 w-3 rounded-sm bg-primary" />
              </div>
              <span className="text-xs text-muted-foreground">More</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
