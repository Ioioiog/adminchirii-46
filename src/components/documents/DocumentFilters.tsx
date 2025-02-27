
import React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { DocumentType } from "@/integrations/supabase/types/document-types";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Grid, List } from "lucide-react";

interface DocumentFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  typeFilter: "all" | DocumentType;
  setTypeFilter: (value: "all" | DocumentType) => void;
  propertyFilter: string;
  setPropertyFilter: (value: string) => void;
  properties?: { id: string; name: string }[];
  viewMode?: "grid" | "list"; 
  setViewMode?: (mode: "grid" | "list") => void;
}

export function DocumentFilters({
  searchTerm,
  setSearchTerm,
  typeFilter,
  setTypeFilter,
  propertyFilter,
  setPropertyFilter,
  properties = [],
  viewMode = "list",
  setViewMode
}: DocumentFiltersProps) {
  return (
    <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 md:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search documents..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as "all" | DocumentType)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All document types</SelectItem>
            <SelectItem value="lease_agreement">Lease Agreement</SelectItem>
            <SelectItem value="lease">Lease</SelectItem>
            <SelectItem value="invoice">Invoice</SelectItem>
            <SelectItem value="receipt">Receipt</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
            <SelectItem value="legal">Legal</SelectItem>
            <SelectItem value="notice">Notice</SelectItem>
            <SelectItem value="inspection">Inspection</SelectItem>
            <SelectItem value="general">General</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>

        {properties && properties.length > 0 && (
          <Select value={propertyFilter} onValueChange={setPropertyFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by property" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All properties</SelectItem>
              {properties.map((property) => (
                <SelectItem key={property.id} value={property.id}>
                  {property.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {setViewMode && (
        <div className="flex justify-end">
          <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as "grid" | "list")}>
            <ToggleGroupItem value="list" aria-label="List view">
              <List className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="grid" aria-label="Grid view">
              <Grid className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      )}
    </div>
  );
}
