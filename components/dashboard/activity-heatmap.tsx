"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TopUrl {
  title: string;
  url: string;
  totalDuration: number;
  totalDurationFormatted: string;
}

interface HeatmapData {
  hour: number;
  dayOfWeek: number;
  totalDuration: number;
  topUrls: TopUrl[];
}

interface ActivityHeatmapProps {
  data: HeatmapData[];
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function getIntensity(value: number, max: number): string {
  if (max === 0 || value === 0) return "bg-muted";
  const ratio = value / max;
  if (ratio < 0.2) return "bg-primary/20";
  if (ratio < 0.4) return "bg-primary/40";
  if (ratio < 0.6) return "bg-primary/60";
  if (ratio < 0.8) return "bg-primary/80";
  return "bg-primary";
}

function formatDuration(seconds: number): string {
  if (!seconds) return "0s";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
}

export function ActivityHeatmap({ data }: ActivityHeatmapProps) {
  // Build a map for quick lookup
  const dataMap = new Map<string, HeatmapData>();
  let maxDuration = 0;

  data.forEach((item) => {
    const key = `${item.dayOfWeek}-${item.hour}`;
    dataMap.set(key, item);
    if (item.totalDuration > maxDuration) maxDuration = item.totalDuration;
  });

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
            <TooltipProvider delayDuration={2000}>
              {DAYS.map((day, dayIndex) => {
                // MongoDB dayOfWeek: 1=Sunday, 2=Monday, etc.
                const mongoDay = dayIndex + 1;
                return (
                  <div key={day} className="flex items-center gap-1 mb-1">
                    <div className="w-10 text-xs text-muted-foreground text-right pr-2">
                      {day}
                    </div>
                    <div className="flex flex-1 gap-0.5">
                      {HOURS.map((hour) => {
                        const key = `${mongoDay}-${hour}`;
                        const item = dataMap.get(key);
                        const duration = item?.totalDuration || 0;
                        const intensity = getIntensity(duration, maxDuration);

                        return (
                          <Tooltip key={hour}>
                            <TooltipTrigger asChild>
                              <div
                                className={`h-4 flex-1 rounded-sm ${intensity} transition-colors cursor-pointer hover:ring-1 hover:ring-foreground`}
                              />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-sm">
                              <div className="space-y-2">
                                <div className="font-semibold text-foreground">
                                  {day} {hour.toString().padStart(2, "0")}:00
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Time Spent: {formatDuration(duration)}
                                </div>
                                {item && item.topUrls.length > 0 && (
                                  <div className="space-y-1 pt-2 border-t border-border">
                                    <div className="text-xs font-semibold text-foreground">
                                      Top URLs:
                                    </div>
                                    <div className="max-h-[180px] overflow-y-auto pr-2 space-y-1">
                                      {item.topUrls.map((url, idx) => (
                                        <div key={idx} className="text-xs">
                                          <div className="truncate text-foreground font-medium">
                                            {url.title || "Untitled"}
                                          </div>
                                          <div className="text-muted-foreground text-xs truncate">
                                            {url.url}
                                          </div>
                                          <div className="text-muted-foreground text-xs">
                                            {url.totalDurationFormatted}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </TooltipProvider>

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
  );
}
