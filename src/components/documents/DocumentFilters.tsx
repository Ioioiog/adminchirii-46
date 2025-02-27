
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DocumentType } from "@/integrations/supabase/types/document-types";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface FilterProperty {
  id: string;
  name: string;
}

interface DocumentFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  typeFilter: "all" | DocumentType;
  setTypeFilter: (value: "all" | DocumentType) => void;
  propertyFilter: string;
  setPropertyFilter: (value: string) => void;
  properties?: FilterProperty[];
  dateRangeFilter?: {
    startDate: string | null;
    endDate: string | null;
  };
  setDateRangeFilter?: (value: { startDate: string | null; endDate: string | null }) => void;
  statusFilter?: string;
  setStatusFilter?: (value: string) => void;
  resetFilters?: () => void;
}

export function DocumentFilters({
  searchTerm,
  setSearchTerm,
  typeFilter,
  setTypeFilter,
  propertyFilter,
  setPropertyFilter,
  properties,
  dateRangeFilter,
  setDateRangeFilter,
  statusFilter,
  setStatusFilter,
  resetFilters
}: DocumentFiltersProps) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    if (setDateRangeFilter && dateRangeFilter) {
      setDateRangeFilter({
        ...dateRangeFilter,
        [field]: value || null
      });
    }
  };

  // List of all document types
  const documentTypes: DocumentType[] = [
    "lease_agreement", 
    "invoice", 
    "receipt", 
    "other", 
    "general", 
    "maintenance", 
    "legal", 
    "notice", 
    "inspection", 
    "lease"
  ];

  return (
    <div className="space-y-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as "all" | DocumentType)}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {documentTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {properties && (
          <Select value={propertyFilter} onValueChange={setPropertyFilter}>
            <SelectTrigger>
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

      <div className="flex justify-between items-center">
        <Button 
          variant="link" 
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="p-0 h-auto text-sm"
        >
          {showAdvancedFilters ? "Hide advanced filters" : "Show advanced filters"}
        </Button>

        {resetFilters && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={resetFilters}
            className="text-xs"
          >
            Reset filters
          </Button>
        )}
      </div>

      {showAdvancedFilters && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4 mt-2">
          {setStatusFilter && (
            <Select value={statusFilter || 'all'} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="signed">Signed</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="terminated">Terminated</SelectItem>
              </SelectContent>
            </Select>
          )}

          {setDateRangeFilter && dateRangeFilter && (
            <>
              <div>
                <Input
                  type="date"
                  placeholder="Start date"
                  value={dateRangeFilter.startDate || ''}
                  onChange={(e) => handleDateChange('startDate', e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <Input
                  type="date"
                  placeholder="End date"
                  value={dateRangeFilter.endDate || ''}
                  onChange={(e) => handleDateChange('endDate', e.target.value)}
                  className="w-full"
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
