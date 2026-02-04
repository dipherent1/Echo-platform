"use client"

import { Button } from "@/components/ui/button"
import { Calendar } from "lucide-react"

interface TimeRangeSelectorProps {
  value: string
  onChange: (value: string) => void
}

export function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  const ranges = [
    { key: "today", label: "Today" },
    { key: "week", label: "This Week" },
    { key: "month", label: "This Month" },
  ]

  return (
    <div className="flex items-center gap-2">
      <Calendar className="h-4 w-4 text-muted-foreground" />
      <div className="flex rounded-md border border-border bg-secondary p-0.5">
        {ranges.map((range) => (
          <Button
            key={range.key}
            variant={value === range.key ? "default" : "ghost"}
            size="sm"
            onClick={() => onChange(range.key)}
            className="px-3 text-xs"
          >
            {range.label}
          </Button>
        ))}
      </div>
    </div>
  )
}
