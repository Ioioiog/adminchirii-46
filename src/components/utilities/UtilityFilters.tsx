
import React from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UtilityFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  typeFilter: string;
  onTypeChange: (value: string) => void;
}

export function UtilityFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  typeFilter,
  onTypeChange,
}: UtilityFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <Input
        placeholder="Search utilities..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="max-w-sm"
      />
      <Select value={statusFilter} onValueChange={onStatusChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="paid">Paid</SelectItem>
          <SelectItem value="overdue">Overdue</SelectItem>
        </SelectContent>
      </Select>
      <Select value={typeFilter} onValueChange={onTypeChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filter by type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="electricity">Electricity</SelectItem>
          <SelectItem value="water">Water</SelectItem>
          <SelectItem value="gas">Gas</SelectItem>
          <SelectItem value="internet">Internet</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
