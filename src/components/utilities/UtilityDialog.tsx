import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Property } from "@/utils/propertyUtils";
import { Plus } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import { findMatchingProperty } from "./utils/propertyMatcher";
import { detectUtilityType } from "./utils/utilityTypeDetector";
import { FileUploader } from "./components/FileUploader";
import { UtilityForm } from "./components/UtilityForm";
import { UtilityType } from "@/integrations/supabase/types/utility";

interface UtilityDialogProps {
  properties: Property[];
  onUtilityCreated: () => void;
}

export function UtilityDialog({ properties, onUtilityCreated }: UtilityDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { availableCurrencies } = useCurrency();

  const [utilityType, setUtilityType] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [issuedDate, setIssuedDate] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(true);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith('image/')) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please upload an image file (JPEG, PNG, etc.).",
      });
      return;
    }

    setFile(selectedFile);
    const fileName = `${crypto.randomUUID()}.${selectedFile.name.split('.').pop()}`;
    
    try {
      setIsProcessing(true);
      setProcessingError(null);
      setShowForm(false);
      
      const { error: uploadError } = await supabase.storage
        .from('utility-invoices')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      const { data, error } = await supabase.functions.invoke('process-utility-pdf', {
        body: { filePath: fileName }
      });

      if (error) throw error;

      if (data?.data) {
        const extractedData = data.data;
        console.log('Extracted data:', extractedData);

        if (extractedData.property_details) {
          const matchingProperty = findMatchingProperty(extractedData.property_details, properties);
          
          if (matchingProperty) {
            setPropertyId(matchingProperty.id);
            toast({
              title: "Property Matched",
              description: `Matched to property: ${matchingProperty.name}`,
            });
          } else {
            toast({
              variant: "destructive",
              title: "No Match Found",
              description: "Please select the property manually.",
            });
          }
        }

        const detectedType = detectUtilityType(
          extractedData.raw_text || '',
          propertyId,
          properties
        );

        if (detectedType) {
          setUtilityType(detectedType);
        } else if (extractedData.utility_type) {
          setUtilityType(extractedData.utility_type.charAt(0).toUpperCase() + 
                      extractedData.utility_type.slice(1).toLowerCase());
        }

        if (extractedData.amount) {
          setAmount(extractedData.amount.toString());
        }
        if (extractedData.currency) {
          setCurrency(extractedData.currency.toUpperCase());
        }
        if (extractedData.due_date) {
          setDueDate(extractedData.due_date);
        }
        if (extractedData.issued_date) {
          setIssuedDate(extractedData.issued_date);
        }
        if (extractedData.invoice_number) {
          setInvoiceNumber(extractedData.invoice_number);
        }

        setShowForm(true);
        toast({
          title: "Success",
          description: "Successfully processed utility bill!",
        });
      } else {
        throw new Error("No data extracted from the image");
      }
    } catch (error: any) {
      console.error("Error handling file:", error);
      setProcessingError(error.message || "Failed to process utility bill.");
      setShowForm(true);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to process utility bill.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async () => {
    if (!propertyId || !utilityType || !amount || !currency || !dueDate || !issuedDate) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill out all required fields.",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const safeUtilityType = utilityType as UtilityType;
      
      const { data: utility, error: utilityError } = await supabase
        .from("utilities")
        .insert([
          {
            type: safeUtilityType,
            amount: parseFloat(amount),
            currency: currency,
            property_id: propertyId,
            due_date: dueDate,
            issued_date: issuedDate,
            status: "pending",
            invoice_number: invoiceNumber || null,
          },
        ])
        .select()
        .single();

      if (utilityError) throw utilityError;

      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('utility-invoices')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { error: invoiceError } = await supabase
          .from("utility_invoices")
          .insert({
            utility_id: utility.id,
            amount: parseFloat(amount),
            due_date: dueDate,
            status: "pending",
            pdf_path: fileName,
            invoice_number: invoiceNumber || null,
          });

        if (invoiceError) throw invoiceError;
      }

      toast({
        title: "Success",
        description: "Utility bill recorded successfully!",
      });
      setOpen(false);
      onUtilityCreated();
    } catch (error: any) {
      console.error("Error recording utility bill:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to record utility bill.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) {
        setIsProcessing(false);
        setProcessingError(null);
        setShowForm(true);
        setFile(null);
        setUtilityType("");
        setAmount("");
        setCurrency("");
        setPropertyId("");
        setDueDate("");
        setIssuedDate("");
        setInvoiceNumber("");
      }
    }}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Utility Bill
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Utility Bill</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <FileUploader
            isProcessing={isProcessing}
            processingError={processingError}
            onFileChange={handleFileChange}
          />

          {showForm && (
            <UtilityForm
              properties={properties}
              propertyId={propertyId}
              setPropertyId={setPropertyId}
              utilityType={utilityType}
              setUtilityType={setUtilityType}
              amount={amount}
              setAmount={setAmount}
              currency={currency}
              setCurrency={setCurrency}
              dueDate={dueDate}
              setDueDate={setDueDate}
              issuedDate={issuedDate}
              setIssuedDate={setIssuedDate}
              invoiceNumber={invoiceNumber}
              setInvoiceNumber={setInvoiceNumber}
              availableCurrencies={availableCurrencies}
            />
          )}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          {showForm && (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Utility Bill"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
