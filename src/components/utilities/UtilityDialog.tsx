
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UtilityForm } from "./components/UtilityForm";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface UtilityDialogProps {
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;
  onUtilityCreated: () => void;
  properties: any[];
}

// Define the allowed utility types
type UtilityType = "electricity" | "water" | "gas" | "internet" | "building maintenance";

export function UtilityDialog({
  isDialogOpen,
  setIsDialogOpen,
  onUtilityCreated,
  properties = [] // Default to empty array if properties is undefined
}: UtilityDialogProps) {
  const { toast } = useToast();
  const [propertyId, setPropertyId] = useState("");
  const [utilityType, setUtilityType] = useState<UtilityType>("electricity");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("RON");
  const [dueDate, setDueDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [issuedDate, setIssuedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Sample currencies array
  const availableCurrencies = [
    { code: "RON", name: "Romanian Leu" },
    { code: "EUR", name: "Euro" },
    { code: "USD", name: "US Dollar" },
  ];

  const handleClose = () => {
    setIsDialogOpen(false);
  };

  const handleSubmit = async () => {
    if (!propertyId || !utilityType || !amount || !currency || !dueDate || !issuedDate) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields"
      });
      return;
    }

    setLoading(true);
    try {
      // Get property details
      const { data: propertyData, error: propertyError } = await supabase
        .from("properties")
        .select("landlord_id")
        .eq("id", propertyId)
        .single();

      if (propertyError) throw propertyError;

      // Insert new utility bill with properly typed data
      const { data, error } = await supabase
        .from("utilities")
        .insert({
          property_id: propertyId,
          type: utilityType, // This is now properly typed
          amount: parseFloat(amount),
          currency,
          due_date: dueDate,
          issued_date: issuedDate,
          invoice_number: invoiceNumber || null,
          status: "pending",
          created_by: propertyData.landlord_id
        });

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Utility bill added successfully"
      });
      
      if (onUtilityCreated) {
        onUtilityCreated();
      }
    } catch (error) {
      console.error("Error creating utility:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add utility bill"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Utility Bill</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <UtilityForm
            properties={properties || []}
            propertyId={propertyId}
            setPropertyId={setPropertyId}
            utilityType={utilityType}
            setUtilityType={(value) => setUtilityType(value as UtilityType)}
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
          <div className="flex justify-end gap-2 mt-4">
            <button 
              className="px-4 py-2 border rounded-md text-sm font-medium" 
              onClick={handleClose}
              type="button"
            >
              Cancel
            </button>
            <button 
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={handleSubmit}
              disabled={loading}
              type="button"
            >
              {loading ? "Adding..." : "Add Utility Bill"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
