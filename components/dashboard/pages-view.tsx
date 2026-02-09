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
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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
  if (!totalSeconds) return "0s"
  
  const minutes = Math.floor(totalSeconds / 60)
  const hours = Math.floor(minutes / 60)
  const seconds = Math.floor(totalSeconds % 60)

  if (hours > 0) return `${hours}h ${minutes % 60}m`
  if (minutes > 0) return `${minutes}m ${seconds}s`
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
  const limit = 20;

  const fetcher = async (url: string) => {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  };

  const endpoint = search
    ? `/api/pages?q=${encodeURIComponent(search)}&limit=${limit}`
    : `/api/pages?page=${page}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}`;

  const { data, isLoading } = useSWR<PagesResponse>(
    token ? endpoint : null,
    fetcher,
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
                  className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <Globe className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-foreground truncate">
                        {page.title}
                      </p>
                      <a
                        href={page.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
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
          {!search && data?.pagination && data.pagination.totalPages > 1 && (
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
    </div>
  );
}
