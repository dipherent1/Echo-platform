"use client";

import * as React from "react";
import { format, parseISO, isValid } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface TimeRangeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  const isCustomDate =
    value !== "today" && value !== "week" && isValid(parseISO(value));

  const handleDateSelect = (newDate: Date | undefined) => {
    if (newDate) {
      onChange(format(newDate, "yyyy-MM-dd"));
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex rounded-md border border-border bg-secondary p-0.5">
        <Button
          variant={value === "today" ? "default" : "ghost"}
          size="sm"
          onClick={() => onChange("today")}
          className="px-3 text-xs"
        >
          Today
        </Button>
        <Button
          variant={value === "week" ? "default" : "ghost"}
          size="sm"
          onClick={() => onChange("week")}
          className="px-3 text-xs"
        >
          This Week
        </Button>
      </div>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={isCustomDate ? "default" : "outline"}
            size="sm"
            className={cn(
              "justify-start text-left font-normal text-xs px-3",
              !isCustomDate && "text-muted-foreground",
              "border-dashed",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {isCustomDate ? (
              format(parseISO(value), "PPP")
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="single"
            selected={isCustomDate ? parseISO(value) : undefined}
            onSelect={handleDateSelect}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
