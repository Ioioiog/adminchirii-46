import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types/json";

interface Property {
  name: string;
}

interface Tenant {
  first_name: string;
  last_name: string;
}

export interface MaintenanceRequest {
  id?: string;
  property_id: string;
  tenant_id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  images: string[];
  notes?: string | null;
  assigned_to?: string | null;
  service_provider_notes?: string | null;
  read_by_landlord?: boolean;
  read_by_tenant?: boolean;
  service_provider_fee?: number;
  service_provider_status?: string | null;
  scheduled_date?: string | null;
  completion_report?: string | null;
  completion_date?: string | null;
  payment_status?: string | null;
  payment_amount?: number;
  cost_estimate?: number | null;
  cost_estimate_notes?: string | null;
  cost_estimate_status?: string | null;
  approval_status?: string | null;
  approval_notes?: string | null;
  rating?: number | null;
  rating_comment?: string | null;
  issue_type?: string | null;
  contact_phone?: string | null;
  preferred_times?: string[];
  invoice_document_path?: string | null;
  document_path?: Json | null;
  property?: Property;
  tenant?: Tenant;
  materials_cost?: number | null;
  created_at: string;
  updated_at: string;
  is_emergency?: boolean;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_instructions?: string;
}

export function useMaintenanceRequest(requestId?: string) {
  const queryClient = useQueryClient();

  const { data: existingRequest } = useQuery({
    queryKey: ['maintenance-request', requestId],
    enabled: !!requestId,
    queryFn: async () => {
      console.log("Fetching maintenance request with ID:", requestId);
      const { data, error } = await supabase
        .from('maintenance_requests')
        .select(`
          *,
          property:properties(name),
          tenant:profiles!maintenance_requests_tenant_id_fkey(
            first_name,
            last_name
          )
        `)
        .eq('id', requestId)
        .single();

      if (error) {
        console.error("Error fetching maintenance request:", error);
        throw error;
      }
      
      console.log("Fetched maintenance request data:", data);
      return data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: MaintenanceRequest) => {
      console.log("Creating maintenance request with data:", data);
      const { error } = await supabase
        .from('maintenance_requests')
        .insert([data]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-requests'] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: MaintenanceRequest) => {
      if (!requestId) throw new Error('No request ID provided for update');
      console.log("Updating maintenance request with data:", data);

      const { error } = await supabase
        .from('maintenance_requests')
        .update(data)
        .eq('id', requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-requests'] });
    }
  });

  return {
    existingRequest,
    createMutation,
    updateMutation,
    isLoading: createMutation.isPending || updateMutation.isPending
  };
}
