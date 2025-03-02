
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface CsvImporterDialogProps {
  showCsvImporter: boolean;
  setShowCsvImporter: (value: boolean) => void;
}

export function CsvImporterDialog({ 
  showCsvImporter, 
  setShowCsvImporter 
}: CsvImporterDialogProps) {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleCsvFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setCsvFile(files[0]);
    }
  };

  const handleCsvImport = async () => {
    if (!csvFile) {
      toast({
        title: "Error",
        description: "Please select a CSV file first",
        variant: "destructive"
      });
      return;
    }

    setIsImporting(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const csv = e.target?.result as string;
        if (!csv) {
          throw new Error("Failed to read CSV file");
        }

        const lines = csv.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        
        const requiredHeaders = ['property_id', 'type', 'amount', 'due_date'];
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
        
        if (missingHeaders.length > 0) {
          throw new Error(`CSV is missing required headers: ${missingHeaders.join(', ')}`);
        }

        const utilityBills = [];
        
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          
          const values = lines[i].split(',').map(v => v.trim());
          const bill: any = {};
          
          headers.forEach((header, index) => {
            bill[header] = values[index] || null;
          });
          
          if (!bill.property_id || !bill.type || !bill.amount || !bill.due_date) {
            continue;
          }
          
          bill.amount = parseFloat(bill.amount);
          
          bill.status = 'pending';
          
          utilityBills.push(bill);
        }
        
        if (utilityBills.length === 0) {
          throw new Error("No valid utility bills found in CSV");
        }
        
        const { error } = await supabase
          .from('utilities')
          .insert(utilityBills);
          
        if (error) throw error;
        
        toast({
          title: "Success",
          description: `Imported ${utilityBills.length} utility bills successfully`
        });
        
        queryClient.invalidateQueries({ queryKey: ['utilities'] });
        
        setShowCsvImporter(false);
        setCsvFile(null);
      };
      
      reader.readAsText(csvFile);
    } catch (error) {
      console.error("Error importing CSV:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to import utility bills",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={showCsvImporter} onOpenChange={setShowCsvImporter}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Utility Bills from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file with utility bill data. The CSV must include these headers: property_id, type, amount, due_date
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="csvFile">
              CSV File
            </label>
            <input
              id="csvFile"
              type="file"
              accept=".csv"
              onChange={handleCsvFileChange}
              className="cursor-pointer rounded-md border border-input bg-transparent px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium"
            />
          </div>

          <div className="pt-2">
            <Button 
              onClick={handleCsvImport} 
              disabled={!csvFile || isImporting}
              className="w-full"
            >
              {isImporting ? "Importing..." : "Import Utility Bills"}
            </Button>

            <div className="mt-4 text-xs text-gray-500">
              <p className="font-semibold">CSV Format Example:</p>
              <pre className="bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                property_id,type,amount,currency,due_date,issued_date,invoice_number{"\n"}
                uuid-here,Electricity,150.50,USD,2023-11-15,2023-10-15,INV-12345
              </pre>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
