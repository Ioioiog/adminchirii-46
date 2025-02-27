
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardList, Users, DollarSign, MessageSquare, FileText, Info } from "lucide-react";
import { MaintenanceRequest } from "../hooks/useMaintenanceRequest";
import { MaintenanceProgressTab } from "../tabs/MaintenanceProgressTab";
import { MaintenanceProviderTab } from "../tabs/MaintenanceProviderTab";
import { MaintenanceCostsTab } from "../tabs/MaintenanceCostsTab";
import { MaintenanceChatTab } from "../tabs/MaintenanceChatTab";
import { MaintenanceDocumentTab } from "../tabs/MaintenanceDocumentTab";
import { MaintenanceDetailsTab } from "../tabs/MaintenanceDetailsTab";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileObject } from "@supabase/storage-js";

interface MaintenanceRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request?: MaintenanceRequest;
  onUpdateRequest: (request: Partial<MaintenanceRequest>) => void;
  documents?: FileObject[];
  isLoadingDocuments?: boolean;
  properties: Array<{ id: string; name: string }>;
  userRole: 'tenant' | 'landlord' | 'service_provider';
  isNew?: boolean;
}

export const MaintenanceRequestModal = ({
  open,
  onOpenChange,
  request,
  onUpdateRequest,
  documents,
  isLoadingDocuments,
  properties,
  userRole,
  isNew = false
}: MaintenanceRequestModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[800px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {isNew ? "Create Maintenance Request" : "Maintenance Request Management"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 min-h-0">
          <Tabs defaultValue="details" className="w-full h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="details" className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                Details
              </TabsTrigger>
              {!isNew && (
                <>
                  <TabsTrigger value="progress" className="flex items-center gap-2">
                    <ClipboardList className="h-4 w-4" />
                    Progress
                  </TabsTrigger>
                  <TabsTrigger value="provider" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Provider
                  </TabsTrigger>
                  <TabsTrigger value="costs" className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Costs
                  </TabsTrigger>
                  <TabsTrigger value="documents" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Documents
                  </TabsTrigger>
                  <TabsTrigger value="communication" className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Chat
                  </TabsTrigger>
                </>
              )}
            </TabsList>

            <ScrollArea className="flex-1 mt-6">
              <div className="space-y-6 px-2">
                <TabsContent value="details">
                  <MaintenanceDetailsTab 
                    request={request}
                    onUpdateRequest={onUpdateRequest}
                    isNew={isNew}
                    properties={properties}
                    userRole={userRole}
                  />
                </TabsContent>

                {!isNew && request && (
                  <>
                    <TabsContent value="progress">
                      <MaintenanceProgressTab 
                        request={request}
                        onUpdateRequest={onUpdateRequest}
                      />
                    </TabsContent>

                    <TabsContent value="provider">
                      <MaintenanceProviderTab
                        request={request}
                        onUpdateRequest={onUpdateRequest}
                      />
                    </TabsContent>

                    <TabsContent value="costs">
                      <MaintenanceCostsTab
                        request={request}
                        onUpdateRequest={onUpdateRequest}
                      />
                    </TabsContent>

                    <TabsContent value="documents" className="bg-background p-6 rounded-lg border">
                      <MaintenanceDocumentTab
                        request={request}
                        onUpdateRequest={onUpdateRequest}
                        documents={documents}
                        isLoading={isLoadingDocuments}
                      />
                    </TabsContent>

                    <TabsContent value="communication" className="bg-background p-6 rounded-lg border">
                      <MaintenanceChatTab requestId={request.id || ''} />
                    </TabsContent>
                  </>
                )}
              </div>
            </ScrollArea>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MaintenanceRequestModal;
