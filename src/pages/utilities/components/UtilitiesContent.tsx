
import { UtilityBillsSection } from "./sections/UtilityBillsSection";
import { MeterReadingsSection } from "./sections/MeterReadingsSection";
import { UtilityProvidersSection } from "./sections/UtilityProvidersSection";
import { UtilityWithProperty } from "../Utilities";
import { UtilityProvider } from "@/components/utilities/providers/types";

type UtilitiesSection = 'bills' | 'readings' | 'providers';

interface UtilitiesContentProps {
  activeSection: UtilitiesSection;
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
}

export function UtilitiesContent({
  activeSection,
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
  providers,
  isProviderLoading,
  landlordId,
  showProviderForm,
  setShowProviderForm,
  editingProvider,
  setEditingProvider,
  onDeleteProvider,
  onEditProvider,
  setShowCsvImporter
}: UtilitiesContentProps) {
  if (userRole !== "landlord" && userRole !== "tenant") return null;

  switch (activeSection) {
    case 'bills':
      return (
        <UtilityBillsSection 
          userRole={userRole}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          propertyFilter={propertyFilter}
          setPropertyFilter={setPropertyFilter}
          filteredUtilities={filteredUtilities}
          setShowCsvImporter={setShowCsvImporter}
        />
      );
    case 'readings':
      return <MeterReadingsSection userRole={userRole} />;
    case 'providers':
      if (userRole !== 'landlord') return null;
      return (
        <UtilityProvidersSection 
          providers={providers}
          isLoading={isProviderLoading}
          landlordId={landlordId}
          showProviderForm={showProviderForm}
          setShowProviderForm={setShowProviderForm}
          editingProvider={editingProvider}
          setEditingProvider={setEditingProvider}
          onDeleteProvider={onDeleteProvider}
          onEditProvider={onEditProvider}
        />
      );
    default:
      return null;
  }
}
