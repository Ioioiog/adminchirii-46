
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Property } from "@/utils/propertyUtils";
import { Loader2, Plus, Upload } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  const [file, setFile] = useState<File | null>(null);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const processPDF = async (file: File, fileName: string) => {
    try {
      setIsProcessing(true);
      setProcessingError(null);

      // Create a processing job
      const { data: job, error: jobError } = await supabase
        .from('pdf_processing_jobs')
        .insert({
          file_path: fileName,
          status: 'pending'
        })
        .select()
        .single();

      if (jobError) throw jobError;

      // Call the edge function to process the PDF
      const { data, error } = await supabase.functions.invoke('process-utility-pdf', {
        body: { pdfPath: fileName, jobId: job.id }
      });

      if (error) throw error;

      // Update form with extracted data
      if (data?.data) {
        setUtilityType(data.data.utility_type || "");
        setAmount(data.data.amount?.toString() || "");
        setDueDate(data.data.due_date || "");
        setShowForm(true);
      }

      toast({
        title: "Success",
        description: "Successfully extracted data from PDF! Please review and submit.",
      });
    } catch (error: any) {
      console.error("Error processing PDF:", error);
      setProcessingError(error.message || "Failed to process PDF");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process PDF. Please try again.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.type !== "application/pdf") {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please upload a PDF file.",
      });
      return;
    }

    setFile(selectedFile);
    const fileName = `${crypto.randomUUID()}.pdf`;
    
    try {
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('utility-pdfs')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Process the PDF
      await processPDF(selectedFile, fileName);
    } catch (error: any) {
      console.error("Error handling PDF:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to upload PDF.",
      });
    }
  };

  const handleSubmit = async () => {
    if (!utilityType || !amount || !propertyId || !dueDate || !currency) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill out all required fields.",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const { data: utility, error: utilityError } = await supabase
        .from("utilities")
        .insert([
          {
            type: utilityType,
            amount: parseFloat(amount),
            currency: currency,
            property_id: propertyId,
            due_date: dueDate,
            status: "pending",
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
    <Dialog open={open} onOpenChange={setOpen}>
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
          <div className="grid gap-2">
            <Label htmlFor="file">Upload Utility Bill PDF</Label>
            <div className="flex flex-col gap-2">
              <Input
                id="file"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="cursor-pointer"
                disabled={isProcessing}
              />
              {isProcessing && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing PDF...
                </div>
              )}
              {processingError && (
                <Alert variant="destructive">
                  <AlertDescription>{processingError}</AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          {showForm && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="property">Property</Label>
                <Select value={propertyId} onValueChange={setPropertyId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select property" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="type">Utility Type</Label>
                <Select value={utilityType} onValueChange={setUtilityType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Electricity">Electricity</SelectItem>
                    <SelectItem value="Water">Water</SelectItem>
                    <SelectItem value="Gas">Gas</SelectItem>
                    <SelectItem value="Internet">Internet</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCurrencies.map((curr) => (
                        <SelectItem key={curr.code} value={curr.code}>
                          {curr.code} - {curr.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </>
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
