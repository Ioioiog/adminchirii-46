
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Plus, Upload, FileSignature } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader } from "@/components/ui/dialog";
import { DocumentDialog } from "@/components/documents/DocumentDialog";

interface DocumentPageHeaderProps {
  activeTab: string;
  userRole: "landlord" | "tenant";
  onUploadClick: () => void;
  onUploadLeaseClick?: () => void;
}

export function DocumentPageHeader({ 
  activeTab, 
  userRole, 
  onUploadClick,
  onUploadLeaseClick
}: DocumentPageHeaderProps) {
  const navigate = useNavigate();
  const [showContractModal, setShowContractModal] = useState(false);

  // Function to handle the create contract button click
  const handleCreateContractClick = () => {
    setShowContractModal(true);
  };

  return (
    <div className="flex items-center justify-between mb-8">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-semibold">
            {activeTab === 'contracts' ? 'Contracts' : 'Property documents'}
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
          {activeTab !== "contracts" && (
            <Button 
              className="bg-blue-600 hover:bg-blue-700" 
              onClick={onUploadClick}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          )}
          
          {activeTab === "contracts" && (
            <Button 
              onClick={handleCreateContractClick} 
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Contract
            </Button>
          )}
        </div>
      )}

      {/* Contract creation dialog */}
      {userRole === "landlord" && (
        <Dialog open={showContractModal} onOpenChange={setShowContractModal}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-semibold text-gray-800">Create Contract</DialogTitle>
              <DialogDescription className="text-gray-600">
                Choose how you want to create your contract
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-6 p-6">
              <div className="border border-gray-200 rounded-lg p-8 flex flex-col items-center justify-center hover:bg-gray-50 cursor-pointer transition-colors shadow-sm hover:shadow-md"
                   onClick={() => {
                     setShowContractModal(false);
                     navigate("/generate-contract");
                   }}>
                <div className="mb-4 bg-green-100 p-4 rounded-full">
                  <Plus className="h-7 w-7 text-green-600" />
                </div>
                <h3 className="text-xl font-medium mb-3 text-gray-800">Create from Scratch</h3>
                <p className="text-center text-gray-600">
                  Build a new contract using our interactive form
                </p>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-8 flex flex-col items-center justify-center hover:bg-purple-50 cursor-pointer transition-all duration-300 shadow-sm hover:shadow-md"
                   onClick={() => {
                     setShowContractModal(false);
                     if (onUploadLeaseClick) {
                       onUploadLeaseClick();
                     } else if (onUploadClick) {
                       onUploadClick();
                     }
                   }}>
                <div className="mb-4 bg-purple-100 p-4 rounded-full">
                  <FileSignature className="h-7 w-7 text-purple-600" />
                </div>
                <h3 className="text-xl font-medium mb-3 text-gray-800">Upload Lease Agreement</h3>
                <p className="text-center text-gray-600">
                  Upload an existing lease agreement document
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
