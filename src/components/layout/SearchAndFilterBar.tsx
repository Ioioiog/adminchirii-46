
import React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchAndFilterBarProps {
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  filterContent?: React.ReactNode;
}

export function SearchAndFilterBar({
  searchPlaceholder = "Search...",
  searchValue,
  onSearchChange,
  filterContent
}: SearchAndFilterBarProps) {
  return (
    <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4 border shadow-sm">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9"
            />
          </div>
          {filterContent}
        </div>
      </div>
    </div>
  );
}
