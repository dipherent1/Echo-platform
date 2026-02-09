"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { PieChart, Pie, Cell } from "recharts";

interface DomainData {
  domain: string;
  totalDuration: number;
  totalDurationFormatted: string;
}

interface DomainChartProps {
  data: DomainData[];
}

// Computed colors for chart
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
];

function formatDuration(seconds: number): string {
  if (!seconds) return "0s";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
}

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
    );
  }

  // Process data to show top 9 + Others
  const sortedData = [...data].sort(
    (a, b) => b.totalDuration - a.totalDuration,
  );
  const LIMIT = 9;
  let displayData = sortedData;

  if (sortedData.length > LIMIT) {
    const top = sortedData.slice(0, LIMIT);
    const others = sortedData.slice(LIMIT);
    const othersDuration = others.reduce(
      (sum, item) => sum + item.totalDuration,
      0,
    );

    displayData = [
      ...top,
      {
        domain: "Others",
        totalDuration: othersDuration,
        totalDurationFormatted: formatDuration(othersDuration),
      },
    ];
  }

  const chartData = displayData.map((item, index) => ({
    ...item,
    fill: CHART_COLORS[index % CHART_COLORS.length],
  }));

  const chartConfig = chartData.reduce(
    (acc, item) => ({
      ...acc,
      [item.domain]: {
        label: item.domain,
        color: item.fill,
      },
    }),
    {} as Record<string, { label: string; color: string }>,
  );

  const total = chartData.reduce((sum, item) => sum + item.totalDuration, 0);

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Time by Domain</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <PieChart width={533} height={300}>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => (
                    <div className="flex items-center gap-2">
                      <span>{name}</span>
                      <span className="font-mono">
                        {
                          chartData.find((d) => d.domain === name)
                            ?.totalDurationFormatted
                        }
                      </span>
                    </div>
                  )}
                />
              }
            />
            <Pie
              data={chartData}
              dataKey="totalDuration"
              nameKey="domain"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.fill}
                  stroke="transparent"
                />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="mt-4 flex flex-wrap gap-3">
          {chartData.map((item) => (
            <div key={item.domain} className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-sm"
                style={{ backgroundColor: item.fill }}
              />
              <span className="text-sm text-muted-foreground">
                {item.domain}
              </span>
              <span className="text-sm text-foreground font-mono">
                {Math.round((item.totalDuration / total) * 100)}%
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
