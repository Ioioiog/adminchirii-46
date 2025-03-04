
import { UtilityBillsSection } from "./sections/UtilityBillsSection";
import { MeterReadingsSection } from "./sections/MeterReadingsSection";
import { UtilityProvidersSection } from "./sections/UtilityProvidersSection";
import { UtilityWithProperty } from "../Utilities";
import { UtilityProvider } from "@/components/utilities/providers/types";
import { UserRole } from "@/hooks/use-user-role";
import { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type UtilitiesSection = 'utilities' | 'providers' | 'meter-readings' | 'calculator';

interface UtilitiesContentProps {
  activeSection: UtilitiesSection;
  userRole: UserRole;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  typeFilter: string;
  setTypeFilter: (value: string) => void;
  propertyFilter: string;
  setPropertyFilter: (value: string) => void;
  filteredUtilities: UtilityWithProperty[];
  providers: any[];
  isProviderLoading: boolean;
  landlordId: string;
  showProviderForm: boolean;
  setShowProviderForm: (value: boolean) => void;
  editingProvider: any;
  setEditingProvider: (provider: any) => void;
  onDeleteProvider: (id: string) => Promise<void>;
  onEditProvider: (provider: UtilityProvider) => void;
  setShowCsvImporter: (value: boolean) => void;
  children?: ReactNode; // Add children prop
}

export function UtilitiesContent({
  activeSection,
  userRole,
  children
}: UtilitiesContentProps) {
  if (userRole !== "landlord" && userRole !== "tenant") return null;

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <Tabs value={activeSection} className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full max-w-md">
          <TabsTrigger value="utilities">Bills</TabsTrigger>
          {userRole === "landlord" && (
            <TabsTrigger value="providers">Providers</TabsTrigger>
          )}
          <TabsTrigger value="meter-readings">Meter Readings</TabsTrigger>
          <TabsTrigger value="calculator">Calculator</TabsTrigger>
        </TabsList>
        <TabsContent value={activeSection}>
          {children}
        </TabsContent>
      </Tabs>
    </div>
  );
}
