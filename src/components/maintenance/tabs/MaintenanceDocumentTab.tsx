
import { Card } from "@/components/ui/card";
import { MaintenanceRequest } from "../hooks/useMaintenanceRequest";
import { FileObject } from "@supabase/storage-js";
import { DocumentUploader } from "../document/DocumentUploader";
import { DocumentList } from "../document/DocumentList";

interface MaintenanceDocumentTabProps {
  request: MaintenanceRequest;
  onUpdateRequest: (request: Partial<MaintenanceRequest>) => void;
  documents?: FileObject[];
  isLoading?: boolean;
}

export function MaintenanceDocumentTab({ 
  request, 
  onUpdateRequest,
  documents,
  isLoading 
}: MaintenanceDocumentTabProps) {
  return (
    <div className="space-y-6">
      <Card className="p-4">
        <div className="space-y-4">
          <DocumentUploader 
            request={request}
            onUpdateRequest={onUpdateRequest}
          />
          <DocumentList 
            request={request}
            onUpdateRequest={onUpdateRequest}
            documents={documents}
            isLoading={isLoading}
          />
        </div>
      </Card>
    </div>
  );
}
