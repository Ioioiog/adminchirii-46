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
    if (!extractedAddress) {
      console.log('No address provided');
      return null;
    }

    console.log('Starting property match for address:', extractedAddress);

    const normalize = (addr: string) => {
      return addr
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
    };

    const belvedere60Match = properties.find(p => {
      const normalizedName = normalize(p.name);
      return normalizedName.includes('belvedere') && normalizedName.includes('60');
    });

    if (belvedere60Match) {
      console.log('✅ Found Belvedere 60 property:', belvedere60Match);
      return belvedere60Match;
    }

    const extractApartmentInfo = (address: string) => {
      // Extract bloc, scara, and apartment numbers
      const blocMatch = /bloc:?\s*(\d+)/i.exec(address);
      const scaraMatch = /scara:?\s*([a-z])/i.exec(address);
      const apartamentMatch = /apartament:?\s*(\d+)/i.exec(address);
      
      if (blocMatch && scaraMatch && apartamentMatch) {
        const bloc = blocMatch[1];
        const scara = scaraMatch[1];
        const apt = apartamentMatch[1];
        const combined = `${bloc}${scara}${apt}`;
        console.log('Extracted apartment info:', { bloc, scara, apt, combined });
        return combined;
      }

      // Handle the combined format like "60 - 7A"
      const combinedMatch = /(\d+)\s*-\s*(\d+)([a-z])/i.exec(address);
      if (combinedMatch) {
        const [_, apt, bloc, scara] = combinedMatch;
        const combined = `${bloc}${scara}${apt}`;
        console.log('Extracted combined format:', { bloc, scara, apt, combined });
        return combined;
      }

      // Try to match B1-10 format specifically for Holban
      const holbanPattern = /b1-?10/i;
      if (holbanPattern.test(address.toLowerCase())) {
        console.log('Found Holban specific apartment format B1-10');
        return 'b110';
      }

      // Try to match B.2.7 format
      const bPattern = /b\.?2\.?7/i;
      if (bPattern.test(address.toLowerCase())) {
        console.log('Found B.2.7 format');
        return 'b.2.7';
      }

      // Extract apartment number for Glucoza addresses
      const glucozaPattern = /ap\.?\s*(\d+)/i;
      const glucozaMatch = address.match(glucozaPattern);
      if (glucozaMatch) {
        console.log(`Found Glucoza apartment number: ${glucozaMatch[1]}`);
        return glucozaMatch[1];
      }

      console.log('No apartment info found in address:', address);
      return null;
    };

    const extractedNormalized = normalize(extractedAddress);
    const extractedAptInfo = extractApartmentInfo(extractedAddress);
    
    console.log('Extracted details:', {
      normalizedAddress: extractedNormalized,
      apartmentInfo: extractedAptInfo
    });

    let matchingProperty = properties.find(p => {
      if (!p.address) return false;

      const propertyNormalized = normalize(p.address);
      const propertyName = normalize(p.name);
      
      // Extract apartment info from property name
      const propertyAptInfo = extractApartmentInfo(propertyName) || 
                             extractApartmentInfo(p.address);
      
      console.log('\nChecking property:', {
        name: p.name,
        normalizedName: propertyName,
        originalAddress: p.address,
        normalizedAddress: propertyNormalized,
        propertyAptInfo
      });

      // Match based on apartment info
      if (extractedAptInfo && propertyAptInfo) {
        const matches = extractedAptInfo === propertyAptInfo;
        console.log('Apartment info comparison:', {
          extracted: extractedAptInfo,
          property: propertyAptInfo,
          matches
        });
        return matches;
      }

      // If no apartment info match, try matching address patterns
      const isLocationMatch = 
        propertyNormalized.includes('belvedere') ||
        propertyNormalized.includes('holban') ||
        propertyNormalized.includes('yacht') ||
        propertyNormalized.includes('glucoza');

      console.log('Location matching results:', {
        isLocationMatch,
        propertyNormalized
      });

      return isLocationMatch;
    });

    if (!matchingProperty) {
      console.log('❌ No matching property found for:', extractedAddress);
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
      setShowForm(false); // Hide form while processing
      
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
          const matchingProperty = findMatchingProperty(extractedData.property_details);
          
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

        if (extractedData.utility_type) {
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
      setShowForm(true); // Show form even if there's an error
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
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) {
        // Reset state when dialog is closed
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
                    <SelectItem value="Building Maintenance">Building Maintenance</SelectItem>
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
