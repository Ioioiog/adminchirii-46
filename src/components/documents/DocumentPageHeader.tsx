
import React from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DocumentPageHeaderProps {
  activeTab: string;
  userRole: "landlord" | "tenant";
  onUploadClick: () => void;
}

export function DocumentPageHeader({ 
  activeTab, 
  userRole, 
  onUploadClick 
}: DocumentPageHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between mb-8">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-semibold">
            {activeTab === 'contracts' ? 'Contracts' : 'Documents'}
          </h1>
        </div>
        <p className="text-gray-500">
          {userRole === 'tenant' 
            ? `View your property related ${activeTab === 'contracts' ? 'contracts' : 'documents'}`
            : `Manage and track all your property-related ${activeTab === 'contracts' ? 'contracts' : 'documents'}`}
        </p>
      </div>

      {userRole === "landlord" && (
        <div className="flex gap-2">
          <Button 
            className="bg-blue-600 hover:bg-blue-700" 
            onClick={onUploadClick}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Agreement
          </Button>
          {activeTab === "contracts" && (
            <Button 
              onClick={() => navigate("/generate-contract")} 
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Contract
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
