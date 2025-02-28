
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Property } from "@/utils/propertyUtils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProfileSchema } from "@/integrations/supabase/database-types/profile";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AlertCircle, FileText } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";

const formSchema = z.object({
  propertyId: z.string().min(1, "Property is required"),
  tenantId: z.string().min(1, "Tenant is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
});

export interface TenantAssignFormProps {
  properties: Property[];
  availableTenants: ProfileSchema["Tables"]["profiles"]["Row"][];
  onSubmit?: (data: z.infer<typeof formSchema>) => void;
  isLoading?: boolean;
  onClose: () => void;
}

export function TenantAssignForm({
  properties,
  availableTenants,
  isLoading = false,
  onClose,
}: TenantAssignFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      propertyId: "",
      tenantId: "",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
    },
  });

  const handleCreateContract = () => {
    onClose();
    navigate("/documents", { state: { activeTab: "contracts" } });
  };

  return (
    <div className="space-y-4">
      <Alert variant="warning" className="bg-amber-50 border-amber-200">
        <AlertCircle className="h-4 w-4 text-amber-700" />
        <AlertTitle className="text-amber-700">Feature Disabled</AlertTitle>
        <AlertDescription className="text-amber-700">
          Direct tenant assignment has been disabled. Tenants can now only be added by creating and signing a contract.
        </AlertDescription>
      </Alert>
      
      <Button 
        onClick={handleCreateContract}
        className="w-full flex items-center justify-center gap-2"
      >
        <FileText className="h-4 w-4" />
        Go to Contracts
      </Button>
      
      <Button 
        variant="outline" 
        onClick={onClose}
        className="w-full"
      >
        Cancel
      </Button>
    </div>
  );
}
