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
  const [issuedDate, setIssuedDate] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(true);

  const findMatchingProperty = (extractedAddress: string) => {
    console.log('Starting property match for address:', extractedAddress);

    const normalize = (addr: string) => {
      return addr
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
    };

    const extractApartmentNumber = (address: string) => {
      // First try to match the B1-10 format specifically for Holban
      const holbanPattern = /b1-?10/i;
      if (holbanPattern.test(address.toLowerCase())) {
        console.log('Found Holban specific apartment format B1-10');
        return 'b110'; // Normalize to match the database format
      }

      // Try to match B.2.7 format
      const bPattern = /b\.?2\.?7/i;
      if (bPattern.test(address.toLowerCase())) {
        console.log('Found B.2.7 format');
        return 'b.2.7';
      }

      // Then try other apartment number patterns
      const patterns = [
        /(?:ap|apartament|ap\.|apartment)\s*([a-z0-9\-\.]+)/i,
        /bl[.]?\s+[a-z]+\s+ap[.]?\s+([a-z0-9\-\.]+)/i,
        /(?:^|\s)([a-z0-9\-\.]+)(?:\s*$)/
      ];

      for (const pattern of patterns) {
        const match = address.match(pattern);
        if (match) {
          const aptNum = match[1].toLowerCase().replace('-', '');
          console.log(`Found apartment number '${aptNum}' in address: ${address}`);
          return aptNum;
        }
      }
      
      console.log('No apartment number found in address:', address);
      return null;
    };

    const extractedNormalized = normalize(extractedAddress);
    const extractedAptNum = extractApartmentNumber(extractedAddress);
    
    console.log('Extracted details:', {
      normalizedAddress: extractedNormalized,
      apartmentNumber: extractedAptNum
    });

    let matchingProperty = properties.find(p => {
      if (!p.address) return false;

      const propertyNormalized = normalize(p.address);
      const propertyName = normalize(p.name).replace('-', ''); // Normalize property name
      
      console.log('\nChecking property:', {
        name: p.name,
        normalizedName: propertyName,
        originalAddress: p.address,
        normalizedAddress: propertyNormalized
      });

      // First check if we're in the right building/street
      const isHolbanMatch = extractedNormalized.includes('holban') && propertyNormalized.includes('holban');
      const isYachtMatch = extractedNormalized.includes('yacht') && propertyNormalized.includes('yacht');
      const isGlucozaMatch = extractedNormalized.includes('glucoza') && propertyNormalized.includes('glucoza');
      
      const isLocationMatch = isHolbanMatch || isYachtMatch || isGlucozaMatch;

      console.log('Location matching results:', {
        isHolbanMatch,
        isYachtMatch,
        isGlucozaMatch,
        isLocationMatch
      });

      if (!isLocationMatch) {
        console.log('Location does not match, skipping apartment check');
        return false;
      }

      // If we found an apartment number in the extracted address, we MUST match it
      if (extractedAptNum) {
        // Try to match against normalized property name
        if (propertyName === extractedAptNum) {
          console.log('Matched apartment number with property name');
          return true;
        }
        
        console.log('Apartment number comparison:', {
          extracted: extractedAptNum,
          propertyName: propertyName,
          matches: propertyName === extractedAptNum
        });
      }

      console.log('No apartment numbers to compare, using location match only');
      return false;
    });

    if (!matchingProperty) {
      console.log('❌ No matching property found');
    } else {
      console.log('✅ Found matching property:', {
        name: matchingProperty.name,
        address: matchingProperty.address
      });
    }

    return matchingProperty;
  };

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
          console.log('Attempting to match property:', extractedData.property_details);
          const matchingProperty = findMatchingProperty(extractedData.property_details);
          
          if (matchingProperty) {
            console.log('Found matching property:', matchingProperty);
            setPropertyId(matchingProperty.id);
            toast({
              title: "Property Matched",
              description: `Matched to property: ${matchingProperty.name}`,
            });
          } else {
            console.log('No matching property found for:', extractedData.property_details);
            toast({
              variant: "destructive",
              title: "No Match Found",
              description: "Please select the property manually.",
            });
          }
        }

        if (extractedData.utility_type) {
          const type = extractedData.utility_type.charAt(0).toUpperCase() + 
                      extractedData.utility_type.slice(1).toLowerCase();
          setUtilityType(type);
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
      }
    } catch (error: any) {
      console.error("Error handling file:", error);
      setProcessingError(error.message || "Failed to process utility bill.");
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
      
      const { data: utility, error: utilityError } = await supabase
        .from("utilities")
        .insert([
          {
            type: utilityType,
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
                <Label htmlFor="property">Property *</Label>
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
                <Label htmlFor="type">Utility Type *</Label>
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
                  <Label htmlFor="amount">Amount *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="currency">Currency *</Label>
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
                <Label htmlFor="dueDate">Due Date *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="issuedDate">Issued Date *</Label>
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
