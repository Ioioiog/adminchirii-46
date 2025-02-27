
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Plus, Upload, FileSignature, Info, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface DocumentPageHeaderProps {
  activeTab: string;
  userRole: "landlord" | "tenant";
  onUploadClick: () => void;
  onUploadLeaseClick?: () => void;
  documentCount?: number;
  contractCount?: number;
}

export function DocumentPageHeader({ 
  activeTab, 
  userRole, 
  onUploadClick,
  onUploadLeaseClick,
  documentCount = 0,
  contractCount = 0
}: DocumentPageHeaderProps) {
  const navigate = useNavigate();
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              {activeTab === 'contracts' ? 'Contracts' : 'Documents'}
              <Badge variant="outline" className="ml-2">
                {activeTab === 'contracts' ? contractCount : documentCount} 
                {(activeTab === 'contracts' ? contractCount : documentCount) === 1 ? 
                  (activeTab === 'contracts' ? ' contract' : ' document') : 
                  (activeTab === 'contracts' ? ' contracts' : ' documents')}
              </Badge>
            </h1>
          </div>
          <p className="text-gray-500 flex items-center">
            {userRole === 'tenant' 
              ? `View your property related ${activeTab === 'contracts' ? 'contracts' : 'documents'}`
              : `Manage and track all your property-related ${activeTab === 'contracts' ? 'contracts' : 'documents'}`}
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="ml-1 inline-flex">
                    <Info className="h-4 w-4 text-gray-400" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    {activeTab === 'contracts' 
                      ? 'Contracts include lease agreements and other legal documents' 
                      : 'Documents include invoices, receipts, and other property-related files'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </p>
        </div>

        {userRole === "landlord" && (
          <div className="flex gap-2">
            {activeTab !== "contracts" && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700" 
                      onClick={onUploadClick}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Document
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Upload invoices, receipts, or general documents</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            {activeTab === "contracts" && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      className="bg-purple-600 hover:bg-purple-700" 
                      onClick={onUploadLeaseClick || onUploadClick}
                    >
                      <FileSignature className="h-4 w-4 mr-2" />
                      Upload Lease Agreement
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Upload existing lease agreements or contracts</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            {activeTab === "contracts" && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      onClick={() => navigate("/generate-contract")} 
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Contract
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Create a new lease agreement or contract from scratch</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        )}
      </div>
      
      {activeTab === 'contracts' && (
        <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
          <Calendar className="h-4 w-4" />
          <span>
            {userRole === 'landlord' 
              ? 'Manage your contracts, send them to tenants for signing, and keep track of their status' 
              : 'View and sign your contracts sent by landlords'}
          </span>
        </div>
      )}
    </div>
  );
}
