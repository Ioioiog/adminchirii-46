
import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuthState } from "@/hooks/useAuthState";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileDown } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import jsPDF from 'jspdf';

interface ContractSection {
  title: string;
  content: string;
}

interface ContractContent {
  sections: ContractSection[];
}

export default function ContractDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentUserId, isLoading: isLoadingAuth } = useAuthState();

  useEffect(() => {
    if (!isLoadingAuth && !currentUserId) {
      navigate("/auth");
    }
  }, [currentUserId, isLoadingAuth, navigate]);

  const { data: contract, isLoading } = useQuery({
    queryKey: ["contract", id],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
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
          .eq("id", id)
          .single();

        if (error) {
          throw error;
        }

        return data;
      } catch (error) {
        console.error("Error fetching contract:", error);
        toast({
          title: "Error",
          description: "Failed to load contract details",
          variant: "destructive",
        });
        throw error;
      }
    },
    enabled: !!id && !!currentUserId,
  });

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

  const generatePDF = () => {
    if (!contract) return;

    const pdf = new jsPDF();
    let yOffset = 20;

    // Add title
    pdf.setFontSize(20);
    pdf.text(contract.template?.name || "Custom Contract", 20, yOffset);
    yOffset += 20;

    // Add property details
    pdf.setFontSize(16);
    pdf.text("Property Details", 20, yOffset);
    yOffset += 10;
    pdf.setFontSize(12);
    pdf.text(contract.property?.address || "", 20, yOffset);
    yOffset += 20;

    // Add contract details
    pdf.setFontSize(16);
    pdf.text("Contract Details", 20, yOffset);
    yOffset += 10;
    pdf.setFontSize(12);
    pdf.text(`Type: ${contract.contract_type}`, 20, yOffset);
    yOffset += 10;
    pdf.text(`Valid From: ${contract.valid_from ? new Date(contract.valid_from).toLocaleDateString() : "Not set"}`, 20, yOffset);
    yOffset += 10;
    pdf.text(`Valid Until: ${contract.valid_until ? new Date(contract.valid_until).toLocaleDateString() : "Not set"}`, 20, yOffset);
    yOffset += 20;

    // Add contract content
    const contractContent = (typeof contract.content === 'object' && contract.content !== null
      ? contract.content
      : { sections: [] }) as ContractContent;

    pdf.setFontSize(16);
    pdf.text("Contract Content", 20, yOffset);
    yOffset += 10;

    contractContent.sections?.forEach((section) => {
      // Add new page if content might overflow
      if (yOffset > 250) {
        pdf.addPage();
        yOffset = 20;
      }

      pdf.setFontSize(14);
      pdf.text(section.title, 20, yOffset);
      yOffset += 10;
      pdf.setFontSize(12);
      
      // Split long content into multiple lines
      const contentLines = pdf.splitTextToSize(section.content, 170);
      pdf.text(contentLines, 20, yOffset);
      yOffset += 10 + (contentLines.length * 7);
    });

    // Save the PDF
    pdf.save(`contract-${contract.id}.pdf`);
    
    toast({
      title: "Success",
      description: "Contract PDF has been generated",
    });
  };

  if (isLoadingAuth || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="container mx-auto py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/contracts")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Contracts
        </Button>
        <div className="text-center py-8">
          <h2 className="text-2xl font-semibold">Contract not found</h2>
        </div>
      </div>
    );
  }

  // First cast to unknown, then to our expected type
  const contractContent = (typeof contract.content === 'object' && contract.content !== null
    ? contract.content
    : { sections: [] }) as unknown as ContractContent;

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => navigate("/contracts")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Contracts
          </Button>
          <Button onClick={generatePDF} variant="outline">
            <FileDown className="w-4 h-4 mr-2" />
            Generate PDF
          </Button>
        </div>
        <Badge
          variant="secondary"
          className={`${getStatusColor(contract.status)} text-white`}
        >
          {contract.status}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{contract.template?.name || "Custom Contract"}</CardTitle>
          <CardDescription>
            Contract for {contract.property?.name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Property Details</h3>
            <p className="text-sm text-muted-foreground">
              {contract.property?.address}
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Contract Details</h3>
            <div className="space-y-2">
              <div>
                <span className="font-medium">Type: </span>
                {contract.contract_type}
              </div>
              <div>
                <span className="font-medium">Valid From: </span>
                {contract.valid_from
                  ? new Date(contract.valid_from).toLocaleDateString()
                  : "Not set"}
              </div>
              <div>
                <span className="font-medium">Valid Until: </span>
                {contract.valid_until
                  ? new Date(contract.valid_until).toLocaleDateString()
                  : "Not set"}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Contract Content</h3>
            {contractContent.sections?.map((section, index) => (
              <div key={index} className="mb-4">
                <h4 className="font-medium mb-2">{section.title}</h4>
                <p className="text-sm text-muted-foreground">
                  {section.content}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
