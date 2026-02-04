"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts"

interface DomainData {
  domain: string
  totalDuration: number
  totalDurationFormatted: string
}

interface DomainChartProps {
  data: DomainData[]
}

// Computed colors for chart bars
const CHART_COLORS = [
  "#4ade80", // green
  "#818cf8", // indigo  
  "#f59e0b", // amber
  "#ec4899", // pink
  "#38bdf8", // sky
  "#a78bfa", // violet
  "#fb923c", // orange
  "#22d3d8", // cyan
  "#f472b6", // pink
  "#84cc16", // lime
]

export function DomainChart({ data }: DomainChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Time by Domain</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[300px] items-center justify-center">
          <p className="text-muted-foreground">No domain data available</p>
        </CardContent>
      </Card>
    )
  }

  const chartData = data.map((item, index) => ({
    ...item,
    fill: CHART_COLORS[index % CHART_COLORS.length],
  }))

  const chartConfig = chartData.reduce(
    (acc, item) => ({
      ...acc,
      [item.domain]: {
        label: item.domain,
        color: item.fill,
      },
    }),
    {} as Record<string, { label: string; color: string }>
  )

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Time by Domain</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 16 }}>
              <XAxis type="number" hide />
              <YAxis
                dataKey="domain"
                type="category"
                width={120}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#9ca3af", fontSize: 12 }}
                tickFormatter={(value) =>
                  value.length > 16 ? `${value.slice(0, 16)}...` : value
                }
              />
              <ChartTooltip
                cursor={{ fill: "rgba(255,255,255,0.05)" }}
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => (
                      <div className="flex items-center gap-2">
                        <span>{name}</span>
                        <span className="font-mono">
                          {chartData.find((d) => d.domain === name)?.totalDurationFormatted}
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <Bar
                dataKey="totalDuration"
                radius={[0, 4, 4, 0]}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

// Add Cell import
import { Cell } from "recharts"
