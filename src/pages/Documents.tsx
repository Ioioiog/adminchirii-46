import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Grid, List, Plus, FileText, Files, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { DocumentList } from "@/components/documents/DocumentList";
import { DocumentDialog } from "@/components/documents/DocumentDialog";
import { DocumentType } from "@/integrations/supabase/types/document-types";
import { DocumentFilters } from "@/components/documents/DocumentFilters";
import { useQuery } from "@tanstack/react-query";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const Documents = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<"landlord" | "tenant" | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [propertyFilter, setPropertyFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState<"all" | DocumentType>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [activeTab, setActiveTab] = useState<"documents" | "contracts">("documents");
  const [contractSearchQuery, setContractSearchQuery] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [selectedProperty, setSelectedProperty] = useState<string>("");

  const { data: properties } = useQuery({
    queryKey: ["properties"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("id, name");
      
      if (error) throw error;
      return data;
    },
    enabled: userRole === "landlord"
  });

  const { data: contracts } = useQuery({
    queryKey: ["contracts"],
    queryFn: async () => {
      try {
        if (!userId) {
          throw new Error("No authenticated user");
        }

        const query = supabase
          .from("contracts")
          .select(`
            *,
            property:property_id (
              id,
              name,
              address
            ),
            template:template_id (
              id,
              name,
              category,
              content
            )
          `)
          .eq('landlord_id', userId);

        const { data, error } = await query;

        if (error) {
          throw error;
        }

        return data;
      } catch (error) {
        console.error("Error fetching contracts:", error);
        toast({
          title: "Error",
          description: "Failed to load contracts",
          variant: "destructive",
        });
        throw error;
      }
    },
    enabled: !!userId,
  });

  const { data: templates } = useQuery({
    queryKey: ["contract_templates"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("contract_templates")
          .select("*")
          .eq("is_active", true)
          .order("name");

        if (error) {
          throw error;
        }

        return data;
      } catch (error) {
        console.error("Error fetching templates:", error);
        toast({
          title: "Error",
          description: "Failed to load contract templates",
          variant: "destructive",
        });
        throw error;
      }
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log("No active session found, redirecting to auth");
        navigate("/auth");
        return;
      }

      setUserId(session.user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .maybeSingle();

      if (profile?.role) {
        setUserRole(profile.role as "landlord" | "tenant");
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Documents page auth state changed:", event);
        if (!session) {
          navigate("/auth");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  const navigationItems = [
    {
      id: 'documents',
      label: 'Documents',
      icon: FileText,
    },
    {
      id: 'contracts',
      label: 'Contracts',
      icon: Files,
    },
  ];

  const handleGenerateContract = async () => {
    if (!selectedTemplate || !selectedProperty) {
      toast({
        title: "Error",
        description: "Please select both a template and a property",
        variant: "destructive",
      });
      return;
    }

    if (!userId) {
      toast({
        title: "Error",
        description: "You must be logged in to generate contracts",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const template = templates?.find(t => t.id === selectedTemplate);
      if (!template) throw new Error("Template not found");

      const { error } = await supabase.from("contracts").insert({
        contract_type: template.category,
        content: template.content,
        template_id: template.id,
        status: "draft",
        property_id: selectedProperty,
        landlord_id: userId,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Contract generated successfully",
      });
    } catch (error) {
      console.error("Error generating contract:", error);
      toast({
        title: "Error",
        description: "Failed to generate contract",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-500";
      case "pending":
        return "bg-yellow-500";
      case "signed":
        return "bg-green-500";
      case "expired":
        return "bg-red-500";
      case "cancelled":
        return "bg-gray-700";
      default:
        return "bg-gray-500";
    }
  };

  const filteredContracts = contracts?.filter((contract) => {
    const searchLower = contractSearchQuery.toLowerCase();
    return (
      contract.contract_type.toLowerCase().includes(searchLower) ||
      contract.property?.name.toLowerCase().includes(searchLower) ||
      contract.property?.address.toLowerCase().includes(searchLower) ||
      contract.template?.name.toLowerCase().includes(searchLower)
    );
  });

  if (!userId || !userRole) return null;

  return (
    <div className="flex bg-[#F8F9FC] min-h-screen">
      <DashboardSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center gap-2 bg-white rounded-lg p-2 shadow-sm">
            {navigationItems.map((item) => (
              <Button
                key={item.id}
                variant={activeTab === item.id ? 'default' : 'ghost'}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg transition-all",
                  activeTab === item.id 
                    ? "bg-blue-600 text-white hover:bg-blue-700" 
                    : "text-gray-600 hover:bg-gray-100"
                )}
                onClick={() => setActiveTab(item.id as "documents" | "contracts")}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Button>
            ))}
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-8">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600 rounded-lg">
                    {activeTab === 'documents' ? (
                      <FileText className="h-6 w-6 text-white" />
                    ) : (
                      <Files className="h-6 w-6 text-white" />
                    )}
                  </div>
                  <h1 className="text-2xl font-semibold">
                    {activeTab === 'documents' ? 'Documents' : 'Contracts'}
                  </h1>
                </div>
                <p className="text-gray-500">
                  {activeTab === 'documents' 
                    ? 'Manage and track all your property-related documents.'
                    : 'Manage and track all your property contracts.'}
                </p>
              </div>

              {userRole === "landlord" && (
                activeTab === "documents" ? (
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => setShowAddModal(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Upload Document
                  </Button>
                ) : (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4 mr-2" />
                        New Contract
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Generate New Contract</DialogTitle>
                        <DialogDescription>
                          Select a template and property to generate a new contract
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Property</label>
                          <Select
                            value={selectedProperty}
                            onValueChange={setSelectedProperty}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a property" />
                            </SelectTrigger>
                            <SelectContent>
                              {properties?.map((property) => (
                                <SelectItem key={property.id} value={property.id}>
                                  {property.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Contract Template</label>
                          <Select
                            value={selectedTemplate}
                            onValueChange={setSelectedTemplate}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a template" />
                            </SelectTrigger>
                            <SelectContent>
                              {templates?.map((template) => (
                                <SelectItem key={template.id} value={template.id}>
                                  {template.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          onClick={handleGenerateContract}
                          disabled={isGenerating || !selectedTemplate || !selectedProperty}
                          className="w-full"
                        >
                          {isGenerating ? "Generating..." : "Generate Contract"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )
              )}
            </div>

            {activeTab === "documents" ? (
              <>
                <DocumentFilters
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  typeFilter={typeFilter}
                  setTypeFilter={setTypeFilter}
                  propertyFilter={propertyFilter}
                  setPropertyFilter={setPropertyFilter}
                  properties={properties}
                />
                <DocumentList 
                  userId={userId} 
                  userRole={userRole}
                  propertyFilter={propertyFilter}
                  typeFilter={typeFilter}
                  searchTerm={searchTerm}
                  viewMode={viewMode}
                />
              </>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search contracts..."
                    value={contractSearchQuery}
                    onChange={(e) => setContractSearchQuery(e.target.value)}
                    className="max-w-sm"
                  />
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Contract Type</TableHead>
                        <TableHead>Property</TableHead>
                        <TableHead>Template</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Valid From</TableHead>
                        <TableHead>Valid Until</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredContracts?.map((contract) => (
                        <TableRow key={contract.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <FileText className="w-4 h-4 mr-2 text-muted-foreground" />
                              {contract.contract_type}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {contract.property?.name}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {contract.property?.address}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {contract.template?.name || "Custom Contract"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={`${getStatusColor(contract.status)} text-white`}
                            >
                              {contract.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {contract.valid_from
                              ? new Date(contract.valid_from).toLocaleDateString()
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {contract.valid_until
                              ? new Date(contract.valid_until).toLocaleDateString()
                              : "-"}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/contracts/${contract.id}`)}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredContracts?.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            <div className="text-muted-foreground">
                              No contracts found
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <DocumentDialog
        open={showAddModal}
        onOpenChange={setShowAddModal}
        userId={userId}
        userRole={userRole}
      />
    </div>
  );
};

export default Documents;
