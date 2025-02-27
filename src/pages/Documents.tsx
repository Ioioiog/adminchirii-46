
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

  const tabs = [
    { id: "documents", label: "Documents" },
    { id: "contracts", label: "Contracts" },
  ];

  if (!userRole || !userId) {
    return <div>Loading...</div>;
  }

  return (
    <PageLayout>
      <NavigationTabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={(tab) => setActiveTab(tab as "documents" | "contracts")}
      />

      <DocumentPageHeader
        activeTab={activeTab}
        userRole={userRole}
        onUploadClick={handleUploadClick}
        onUploadLeaseClick={handleUploadLeaseClick}
      />

      <SearchAndFilterBar
        searchPlaceholder="Search documents..."
        onSearchChange={setSearchQuery}
        filters={
          <DocumentFilters
            userRole={userRole}
            filters={filters}
            setFilters={setFilters}
          />
        }
      />

      {activeTab === "documents" ? (
        <DocumentList
          searchQuery={searchQuery}
          filters={filters}
          userRole={userRole}
          userId={userId}
        />
      ) : (
        <ContractsTable
          searchQuery={searchQuery}
          filters={filters}
          userRole={userRole}
          userId={userId}
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
