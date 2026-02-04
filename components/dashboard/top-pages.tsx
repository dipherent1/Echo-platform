"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, ExternalLink } from "lucide-react"

interface TopPage {
  pageId: string
  title: string
  url: string
  domain: string
  totalDuration: number
  totalDurationFormatted: string
}

interface TopPagesProps {
  data: TopPage[]
}

export function TopPages({ data }: TopPagesProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Top Pages</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[200px] items-center justify-center">
          <p className="text-muted-foreground">No pages tracked yet</p>
        </CardContent>
      </Card>
    )
  }

  const maxDuration = Math.max(...data.map((p) => p.totalDuration))

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Top Pages</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.slice(0, 5).map((page, index) => (
            <div key={page.pageId} className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-sm font-medium text-muted-foreground w-4">
                    {index + 1}.
                  </span>
                  <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm text-foreground truncate">{page.title}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-sm font-mono text-muted-foreground">
                    {page.totalDurationFormatted}
                  </span>
                  <a
                    href={page.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
              <div className="ml-6 h-1.5 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${(page.totalDuration / maxDuration) * 100}%` }}
                />
              </div>
              <p className="ml-6 text-xs text-muted-foreground truncate">{page.domain}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
