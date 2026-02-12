"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  ExternalLink,
  Globe,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ArrowUp,
  ArrowDown,
  Clock,
  Calendar as CalendarIcon,
} from "lucide-react";
import {
  formatDistanceToNow,
  format,
  subDays,
  startOfDay,
  endOfDay,
} from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";

interface Page {
  id: string;
  url: string;
  domain: string;
  title: string;
  description: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
  totalDuration?: number;
}

interface PagesResponse {
  pages: Page[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  query?: string;
}

function formatDuration(totalSeconds?: number) {
  if (!totalSeconds) return "0s";

  const minutes = Math.floor(totalSeconds / 60);
  const hours = Math.floor(minutes / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export function PagesView() {
  const { token } = useAuth();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<"lastSeenAt" | "totalDuration">(
    "lastSeenAt",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });

  const limit = 20;

  const fetcher = async (url: string) => {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  };

  const endpoint = search
    ? `/api/pages?q=${encodeURIComponent(search)}&page=${page}&limit=${limit}`
    : `/api/pages?page=${page}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}`;

  const { data, isLoading } = useSWR<PagesResponse>(
    token ? endpoint : null,
    fetcher,
  );

  const { data: pageStats, isLoading: isLoadingStats } = useSWR(
    token && selectedPage && dateRange.from && dateRange.to
      ? `/api/pages/${selectedPage.id}/stats?startDate=${dateRange.from.toISOString()}&endDate=${dateRange.to.toISOString()}`
      : null,
    fetcher,
    {
      onError: (err) => {
        console.error("Failed to fetch page stats:", err);
      },
    },
  );

  const toggleSort = (newSortBy: "lastSeenAt" | "totalDuration") => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(newSortBy);
      setSortOrder("desc");
    }
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Pages</h2>
        <p className="text-muted-foreground">
          All the pages you{"'"}ve visited, stored in your knowledge base.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search pages by title, URL, or domain..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="pl-10 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
        />
      </div>

      {/* Results */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-foreground">
            {search ? "Search Results" : "All Pages"}
            {data?.pagination && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({data.pagination.total} total)
              </span>
            )}
          </CardTitle>
          {!search && (
            <div className="flex gap-2">
              <Button
                variant={sortBy === "lastSeenAt" ? "secondary" : "outline"}
                size="sm"
                onClick={() => toggleSort("lastSeenAt")}
                className="gap-2"
              >
                {sortBy === "lastSeenAt" &&
                  (sortOrder === "desc" ? (
                    <ArrowDown className="h-3 w-3" />
                  ) : (
                    <ArrowUp className="h-3 w-3" />
                  ))}
                Last Seen
              </Button>
              <Button
                variant={sortBy === "totalDuration" ? "secondary" : "outline"}
                size="sm"
                onClick={() => toggleSort("totalDuration")}
                className="gap-2"
              >
                {sortBy === "totalDuration" &&
                  (sortOrder === "desc" ? (
                    <ArrowDown className="h-3 w-3" />
                  ) : (
                    <ArrowUp className="h-3 w-3" />
                  ))}
                Time Spent
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : data?.pages && data.pages.length > 0 ? (
            <div className="space-y-3">
              {data.pages.map((page) => (
                <div
                  key={page.id}
                  onClick={() => setSelectedPage(page)}
                  className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer group"
                >
                  <Globe className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0 group-hover:text-primary transition-colors" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-foreground truncate">
                        {page.title}
                      </p>
                      <div className="flex items-center gap-2">
                        <a
                          href={page.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {page.url}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="bg-secondary px-2 py-0.5 rounded">
                        {page.domain}
                      </span>
                      <span>
                        Last seen{" "}
                        {formatDistanceToNow(new Date(page.lastSeenAt), {
                          addSuffix: true,
                        })}
                      </span>
                      {page.totalDuration !== undefined && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDuration(page.totalDuration)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Globe className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                {search
                  ? "No pages found matching your search"
                  : "No pages tracked yet"}
              </p>
            </div>
          )}

          {/* Pagination */}
          {data?.pagination && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Page {data.pagination.page} of {data.pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= data.pagination.totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={!!selectedPage}
        onOpenChange={(open) => !open && setSelectedPage(null)}
      >
        <DialogContent className="max-w-6xl w-[90vw] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Globe className="h-5 w-5 text-primary" />
              {selectedPage?.title || "Page Details"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground break-all">
                  {selectedPage?.url}
                </p>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "justify-start text-left font-normal w-[240px]",
                      !dateRange && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")}-{" "}
                          {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange as any}
                    onSelect={(range: any) => setDateRange(range)}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {isLoadingStats ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : pageStats ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card className="bg-secondary/30 border-border px-4 py-3">
                    <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">
                      Total Time
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {formatDuration(pageStats.summary.totalDuration)}
                    </p>
                  </Card>
                  <Card className="bg-secondary/30 border-border px-4 py-3">
                    <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">
                      Visits
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {pageStats.summary.count}
                    </p>
                  </Card>
                  <Card className="bg-secondary/30 border-border px-4 py-3">
                    <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">
                      Avg. Session
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {formatDuration(
                        pageStats.summary.count > 0
                          ? pageStats.summary.totalDuration /
                              pageStats.summary.count
                          : 0,
                      )}
                    </p>
                  </Card>
                </div>

                <div className="h-[300px] w-full bg-secondary/10 rounded-lg p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={pageStats.daily}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#374151"
                      />
                      <XAxis
                        dataKey="date"
                        stroke="#9ca3af"
                        fontSize={12}
                        tickFormatter={(val) => format(new Date(val), "MMM dd")}
                      />
                      <YAxis
                        stroke="#9ca3af"
                        fontSize={12}
                        tickFormatter={(val) => formatDuration(val)}
                      />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: "#1f2937",
                          border: "1px solid #374151",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => [
                          formatDuration(value),
                          "Time Spent",
                        ]}
                        labelFormatter={(label) =>
                          format(new Date(label), "PPPP")
                        }
                        cursor={{
                          fill: "rgba(255,255,255,0.05)",
                          strokeWidth: 0,
                        }}
                      />
                      <Bar
                        dataKey="duration"
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : null}

            {!isLoadingStats && !pageStats && (
              <div className="text-center py-20 text-muted-foreground">
                No data found for this date range.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
