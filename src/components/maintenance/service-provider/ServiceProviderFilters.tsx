
import React from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface Filters {
  search: string;
  category: string;
  rating: string;
  createdByMe: boolean;
}

interface ServiceProviderFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

export function ServiceProviderFilters({ filters, onFiltersChange }: ServiceProviderFiltersProps) {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        <div className="relative">
          <Input
            placeholder="Search providers..."
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            className="pl-10"
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>

        <Select
          value={filters.category}
          onValueChange={(value) => onFiltersChange({ ...filters, category: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="plumbing">Plumbing</SelectItem>
            <SelectItem value="electrical">Electrical</SelectItem>
            <SelectItem value="hvac">HVAC</SelectItem>
            <SelectItem value="general">General Maintenance</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.rating}
          onValueChange={(value) => onFiltersChange({ ...filters, rating: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by rating" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ratings</SelectItem>
            <SelectItem value="4">4+ Stars</SelectItem>
            <SelectItem value="3">3+ Stars</SelectItem>
            <SelectItem value="2">2+ Stars</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center space-x-2">
          <Switch
            id="created-by-me"
            checked={filters.createdByMe}
            onCheckedChange={(checked) => onFiltersChange({ ...filters, createdByMe: checked })}
          />
          <Label htmlFor="created-by-me">Created by my landlord</Label>
        </div>
      </div>
    </div>
  );
}
