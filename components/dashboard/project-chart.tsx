"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"

interface ProjectData {
  projectId: string | null
  projectName: string
  color: string
  totalDuration: number
  totalDurationFormatted: string
}

interface ProjectChartProps {
  data: ProjectData[]
}

export function ProjectChart({ data }: ProjectChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Time by Project</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[300px] items-center justify-center">
          <p className="text-muted-foreground">No project data available</p>
        </CardContent>
      </Card>
    )
  }

  const chartConfig = data.reduce(
    (acc, item) => ({
      ...acc,
      [item.projectName]: {
        label: item.projectName,
        color: item.color,
      },
    }),
    {} as Record<string, { label: string; color: string }>
  )

  const total = data.reduce((sum, item) => sum + item.totalDuration, 0)

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Time by Project</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => (
                      <div className="flex items-center gap-2">
                        <span>{name}</span>
                        <span className="font-mono">
                          {data.find((d) => d.projectName === name)?.totalDurationFormatted}
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <Pie
                data={data}
                dataKey="totalDuration"
                nameKey="projectName"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
        <div className="mt-4 flex flex-wrap gap-3">
          {data.map((item) => (
            <div key={item.projectName} className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-sm"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-muted-foreground">{item.projectName}</span>
              <span className="text-sm text-foreground font-mono">
                {Math.round((item.totalDuration / total) * 100)}%
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
