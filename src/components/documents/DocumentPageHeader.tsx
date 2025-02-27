
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentDialog } from "@/components/documents/DocumentDialog";
import { useLocation } from "react-router-dom";

interface DocumentPageHeaderProps {
  userRole: string;
  userId: string;
  activeTab: string;
  onTabChange: (value: string) => void;
}

export function DocumentPageHeader({
  userRole,
  userId,
  activeTab,
  onTabChange,
}: DocumentPageHeaderProps) {
  const [showDocumentDialog, setShowDocumentDialog] = useState(false);
  const location = useLocation();
  const state = location.state as { activeTab?: string } | null;

  // Use the state from location or the prop
  const currentTab = state?.activeTab || activeTab;

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-4 border-b mb-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
        <p className="text-muted-foreground">
          Manage and access all your property documents.
        </p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 mt-4 md:mt-0 w-full md:w-auto">
        <Tabs
          value={currentTab}
          onValueChange={onTabChange}
          className="w-full md:w-auto"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="all">All Documents</TabsTrigger>
            <TabsTrigger value="contracts">Contracts</TabsTrigger>
          </TabsList>
        </Tabs>
        
        {userRole === "landlord" && (
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => setShowDocumentDialog(true)}
          >
            Create Lease Agreement
          </Button>
        )}
      </div>

      <DocumentDialog
        open={showDocumentDialog}
        onOpenChange={setShowDocumentDialog}
        userId={userId}
        userRole={userRole}
      />
    </div>
  );
}
