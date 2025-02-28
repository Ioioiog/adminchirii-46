
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types/json";
import { toast } from "@/hooks/use-toast";
import { useEffect } from "react";

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

  // Set up real-time subscription for maintenance request changes
  useEffect(() => {
    if (!requestId) return;

    console.log("Setting up real-time subscription for maintenance request:", requestId);
    
    const channel = supabase
      .channel(`maintenance_request_${requestId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all changes
          schema: 'public',
          table: 'maintenance_requests',
          filter: `id=eq.${requestId}`
        },
        (payload) => {
          console.log('Maintenance request change detected:', payload);
          queryClient.invalidateQueries({ queryKey: ['maintenance-request', requestId] });
        }
      )
      .subscribe();

    // Cleanup subscription when component unmounts or requestId changes
    return () => {
      supabase.removeChannel(channel);
    };
  }, [requestId, queryClient]);

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

  const cancelMutation = useMutation({
    mutationFn: async (contractId: string) => {
      console.log("Cancelling contract with ID:", contractId);
      const { error } = await supabase
        .from('contracts')
        .update({ status: 'cancelled' })
        .eq('id', contractId);

      if (error) {
        console.error("Error cancelling contract:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Contract cancelled",
        description: "The contract has been cancelled successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to cancel the contract. Please try again.",
        variant: "destructive",
      });
      console.error("Cancel contract error:", error);
    }
  });

  return {
    existingRequest,
    createMutation,
    updateMutation,
    cancelMutation,
    isLoading: createMutation.isPending || updateMutation.isPending || cancelMutation.isPending
  };
}
