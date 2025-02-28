
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export function useMaintenanceDocuments(requestId: string | undefined, enabled: boolean) {
  const queryClient = useQueryClient();

  // Set up real-time subscription for maintenance document changes
  useEffect(() => {
    if (!requestId) return;

    console.log("Setting up maintenance documents subscription for request:", requestId);
    
    const channel = supabase
      .channel(`maintenance_docs_${requestId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all changes
          schema: 'public',
          table: 'maintenance_requests',
          filter: `id=eq.${requestId}`
        },
        (payload) => {
          console.log('Maintenance request document change detected:', payload);
          queryClient.invalidateQueries({ queryKey: ["maintenance-documents", requestId] });
        }
      )
      .subscribe();

    // Cleanup subscription when component unmounts or requestId changes
    return () => {
      supabase.removeChannel(channel);
    };
  }, [requestId, queryClient]);

  return useQuery({
    queryKey: ["maintenance-documents", requestId],
    enabled: !!requestId && enabled,
    queryFn: async () => {
      console.log("Fetching documents for request:", requestId);
      try {
        const { data: files, error } = await supabase
          .storage
          .from('maintenance-documents')
          .list(requestId || '');

        if (error) {
          console.error("Error fetching documents:", error);
          return [];
        }

        console.log(`Found ${files?.length || 0} documents`);
        return files || [];
      } catch (error) {
        console.error("Unexpected error in documents query:", error);
        return [];
      }
    }
  });
}
