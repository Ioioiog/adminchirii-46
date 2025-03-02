
import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import { Plug, FileSpreadsheet } from "lucide-react";
import { UtilityDialog } from "@/components/utilities/UtilityDialog";
import { UtilityList } from "@/components/utilities/UtilityList";
import { UtilityFilters } from "@/components/utilities/UtilityFilters";
import { useProperties } from "@/hooks/useProperties";
import { UtilityWithProperty } from "../../Utilities";

interface UtilityBillsSectionProps {
  userRole: string;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  typeFilter: string;
  setTypeFilter: (value: string) => void;
  propertyFilter: string;
  setPropertyFilter: (value: string) => void;
  filteredUtilities: UtilityWithProperty[];
  setShowCsvImporter: (value: boolean) => void;
}

export function UtilityBillsSection({
  userRole,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  typeFilter,
  setTypeFilter,
  propertyFilter,
  setPropertyFilter,
  filteredUtilities,
  setShowCsvImporter
}: UtilityBillsSectionProps) {
  const { properties } = useProperties({
    userRole: userRole === "landlord" || userRole === "tenant" ? userRole : "tenant"
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600/10 rounded-xl">
              <Plug className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-2xl">Utilities</CardTitle>
              <p className="text-gray-500 mt-1">
                Manage and track utility services for your properties.
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {userRole === "landlord" && properties && (
            <>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => setShowCsvImporter(true)}
              >
                <FileSpreadsheet className="h-4 w-4" />
                Import CSV
              </Button>
              <UtilityDialog properties={properties} onUtilityCreated={() => {}} />
            </>
          )}
        </div>
      </div>

      <UtilityFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        typeFilter={typeFilter}
        onTypeChange={setTypeFilter}
        propertyFilter={propertyFilter}
        onPropertyChange={setPropertyFilter}
        properties={properties || []}
      />

      <UtilityList 
        utilities={filteredUtilities}
        userRole={userRole}
        onStatusUpdate={() => {}}
      />
    </div>
  );
}
