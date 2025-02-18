
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
import { Loader2, Plus } from "lucide-react";
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
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [issuedDate, setIssuedDate] = useState("");

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
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('utility-invoices')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Process the image with OCR
      const { data, error } = await supabase.functions.invoke('process-utility-pdf', {
        body: { filePath: fileName }
      });

      if (error) throw error;

      // Update form with extracted data if available
      if (data?.data) {
        if (data.data.invoice_number) {
          setInvoiceNumber(data.data.invoice_number);
        }
        if (data.data.issued_date) {
          setIssuedDate(data.data.issued_date);
        }
        setShowForm(true);
      }

      toast({
        title: "Success",
        description: "Successfully processed utility bill!",
      });
    } catch (error: any) {
      console.error("Error handling file:", error);
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
            invoice_number: invoiceNumber || null,
            issued_date: issuedDate || null,
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
            <Label htmlFor="file">Upload Utility Bill Image</Label>
            <div className="flex flex-col gap-2">
              <Input
                id="file"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="cursor-pointer"
                disabled={isProcessing}
              />
              {isProcessing && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing image...
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

              <div className="grid gap-2">
                <Label htmlFor="issuedDate">Issued Date</Label>
                <Input
                  id="issuedDate"
                  type="date"
                  value={issuedDate}
                  onChange={(e) => setIssuedDate(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="invoiceNumber">Invoice Number</Label>
                <Input
                  id="invoiceNumber"
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
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
