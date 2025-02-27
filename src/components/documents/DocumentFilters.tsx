
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DocumentType } from "@/integrations/supabase/types/document-types";

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
}

export function DocumentFilters({
  searchTerm,
  setSearchTerm,
  typeFilter,
  setTypeFilter,
  propertyFilter,
  setPropertyFilter,
  properties,
}: DocumentFiltersProps) {
  return (
    <div className="space-y-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Input
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as "all" | DocumentType)}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="lease_agreement">Lease Agreement</SelectItem>
            <SelectItem value="lease">Lease</SelectItem>
            <SelectItem value="invoice">Invoice</SelectItem>
            <SelectItem value="receipt">Receipt</SelectItem>
            <SelectItem value="general">General Document</SelectItem>
            <SelectItem value="maintenance">Maintenance Document</SelectItem>
            <SelectItem value="legal">Legal Document</SelectItem>
            <SelectItem value="notice">Notice</SelectItem>
            <SelectItem value="inspection">Inspection Report</SelectItem>
            <SelectItem value="other">Other</SelectItem>
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
    </div>
  );
}
