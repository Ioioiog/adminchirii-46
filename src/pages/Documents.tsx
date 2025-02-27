
import React, { useState } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { NavigationTabs } from "@/components/layout/NavigationTabs";
import { DocumentPageHeader } from "@/components/documents/DocumentPageHeader";
import { DocumentList } from "@/components/documents/DocumentList";
import { DocumentDialog } from "@/components/documents/DocumentDialog";
import { ContractsTable } from "@/components/documents/ContractsTable";
import { SearchAndFilterBar } from "@/components/layout/SearchAndFilterBar";
import { DocumentFilters } from "@/components/documents/DocumentFilters";
import { useUserRole } from "@/hooks/use-user-role";
import { FileText, ScrollText } from "lucide-react"; // Import icons for tabs

export default function Documents() {
  const [activeTab, setActiveTab] = useState<"documents" | "contracts">("documents");
  const [openDialog, setOpenDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    property: "",
    tenant: "",
    type: "",
    dateRange: {
      from: undefined,
      to: undefined,
    } as { from: Date | undefined; to: Date | undefined },
  });
  const { userRole, userId } = useUserRole();
  const [dialogDocumentType, setDialogDocumentType] = useState<"general" | "lease_agreement">("general");

  const handleUploadClick = () => {
    setDialogDocumentType("general");
    setOpenDialog(true);
  };

  const handleUploadLeaseClick = () => {
    setDialogDocumentType("lease_agreement");
    setOpenDialog(true);
  };

  // Adding the required icon property to each tab
  const tabs = [
    { id: "documents", label: "Documents", icon: FileText, showForTenant: true },
    { id: "contracts", label: "Contracts", icon: ScrollText, showForTenant: true },
  ];

  if (!userRole || !userId) {
    return <div>Loading...</div>;
  }

  return (
    <PageLayout>
      <NavigationTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as "documents" | "contracts")}
      />

      <DocumentPageHeader
        activeTab={activeTab}
        userRole={userRole === "service_provider" ? "tenant" : userRole} // Handle service_provider as tenant for UI purposes
        onUploadClick={handleUploadClick}
        onUploadLeaseClick={handleUploadLeaseClick}
      />

      <SearchAndFilterBar
        searchValue={searchQuery}
        searchPlaceholder="Search documents..."
        onSearchChange={setSearchQuery}
        filterContent={
          <DocumentFilters
            searchTerm={searchQuery}
            setSearchTerm={setSearchQuery}
            typeFilter="all"
            setTypeFilter={() => {}}
            propertyFilter=""
            setPropertyFilter={() => {}}
          />
        }
      />

      {activeTab === "documents" ? (
        <DocumentList
          viewMode="grid"
          userId={userId}
          userRole={userRole === "service_provider" ? "tenant" : userRole} // Handle service_provider
          propertyFilter=""
          typeFilter="all"
          searchTerm={searchQuery}
        />
      ) : (
        <ContractsTable
          contracts={[]}
          userRole={userRole === "service_provider" ? "tenant" : userRole} // Handle service_provider
          isLoading={false}
          handleDownloadDocument={() => Promise.resolve()}
          handleGeneratePDF={() => {}}
          deleteContractMutation={{
            mutate: () => {},
            isLoading: false,
            isError: false,
            isSuccess: false,
            reset: () => {},
            status: "idle",
            error: null,
            context: undefined,
            failureCount: 0,
            failureReason: null,
            isPending: false,
            submittedAt: 0,
            variables: "",
            mutateAsync: async () => {}
          }}
        />
      )}

      <DocumentDialog
        open={openDialog}
        onOpenChange={setOpenDialog}
        userId={userId}
        userRole={userRole}
        initialDocumentType={dialogDocumentType}
      />
    </PageLayout>
  );
}
