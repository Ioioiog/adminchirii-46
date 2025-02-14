import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/use-user-role";
import { useAuthState } from "@/hooks/useAuthState";
import { FileText, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

export default function ContractsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userRole } = useUserRole();
  const { currentUserId, isLoading: isLoadingAuth } = useAuthState();
  const [searchQuery, setSearchQuery] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [selectedProperty, setSelectedProperty] = useState<string>("");

  // Use effect to handle authentication
  useEffect(() => {
    if (!isLoadingAuth && !currentUserId) {
      navigate("/auth");
    }
  }, [currentUserId, isLoadingAuth, navigate]);

  const { data: contracts, isLoading: isLoadingContracts } = useQuery({
    queryKey: ["contracts"],
    queryFn: async () => {
      try {
        if (!currentUserId) {
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
              name
            )
          `)
          .eq('landlord_id', currentUserId);

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
    enabled: !!currentUserId,
  });

  const { data: templates, isLoading: isLoadingTemplates } = useQuery({
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

  const { data: properties } = useQuery({
    queryKey: ["properties"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("properties")
          .select("*")
          .order("name");

        if (error) {
          throw error;
        }

        return data;
      } catch (error) {
        console.error("Error fetching properties:", error);
        toast({
          title: "Error",
          description: "Failed to load properties",
          variant: "destructive",
        });
        throw error;
      }
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const handleGenerateContract = async () => {
    if (!selectedTemplate || !selectedProperty) {
      toast({
        title: "Error",
        description: "Please select both a template and a property",
        variant: "destructive",
      });
      return;
    }

    if (!currentUserId) {
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
        landlord_id: currentUserId,
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
    const searchLower = searchQuery.toLowerCase();
    return (
      contract.contract_type.toLowerCase().includes(searchLower) ||
      contract.property?.name.toLowerCase().includes(searchLower) ||
      contract.property?.address.toLowerCase().includes(searchLower)
    );
  });

  if (isLoadingAuth || isLoadingContracts) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Contracts</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track all your property contracts
          </p>
        </div>
        {userRole === "landlord" && (
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
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
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contract Overview</CardTitle>
          <CardDescription>
            View and manage all your property-related contracts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search contracts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
                      <Button variant="ghost" size="sm">
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
        </CardContent>
      </Card>
    </div>
  );
}
