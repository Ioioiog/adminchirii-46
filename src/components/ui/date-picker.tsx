
import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
  date: Date | undefined;
  onSelect: (date: Date | undefined) => void;
  disabled?: boolean | ((date: Date) => boolean);
  mode?: "single" | "range" | "multiple";
}

export function DatePicker({
  date,
  onSelect,
  disabled = false,
  mode = "single"
}: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        {/* Render the appropriate Calendar based on mode */}
        {mode === "single" && (
          <Calendar
            mode="single"
            selected={date}
            onSelect={onSelect}
            disabled={disabled}
            initialFocus
          />
        )}
        {mode === "range" && (
          <Calendar
            mode="range"
            selected={date ? { from: date, to: date } : undefined}
            onSelect={(range) => {
              if (range?.from) onSelect(range.from);
            }}
            disabled={disabled}
            initialFocus
          />
        )}
        {mode === "multiple" && (
          <Calendar
            mode="multiple"
            selected={date ? [date] : []}
            onSelect={(dates) => {
              if (dates?.length) onSelect(dates[0]);
              else onSelect(undefined);
            }}
            disabled={disabled}
            initialFocus
          />
        )}
      </PopoverContent>
    </Popover>
  );
}
