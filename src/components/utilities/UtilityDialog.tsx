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
import { Plus, Upload } from "lucide-react";

interface UtilityDialogProps {
  properties: Property[];
  onUtilityCreated: () => void;
}

export function UtilityDialog({ properties, onUtilityCreated }: UtilityDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const [utilityType, setUtilityType] = useState("");
  const [amount, setAmount] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async () => {
    if (!utilityType || !amount || !propertyId || !dueDate) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill out all required fields.",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // First create the utility record
      const { data: utility, error: utilityError } = await supabase
        .from("utilities")
        .insert([
          {
            type: utilityType,
            amount: parseFloat(amount),
            property_id: propertyId,
            due_date: dueDate,
            status: "pending",
          },
        ])
        .select()
        .single();

      if (utilityError) throw utilityError;

      // If there's a file, upload it and create an invoice record
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
        <Button className="flex items-center gap-2">
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
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="file">Upload Bill (Optional)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file"
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="flex-1"
              />
              {file && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setFile(null)}
                >
                  <Upload className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Adding..." : "Add Utility Bill"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}