
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Payment } from "@/integrations/supabase/types/payment";

export const usePayments = () => {
  const { toast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchPayments = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log("Fetching payments data");
      
      // Optimize the query by using inner joins and applying status filtering at DB level
      let query = supabase
        .from("payments")
        .select(`
          *,
          tenancy:tenancies!inner (
            property:properties!inner (
              name,
              address
            ),
            tenant:profiles!inner (
              first_name,
              last_name,
              email
            )
          )
        `);
        
      // Apply status filter at the database level if set
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }
      
      const { data: paymentsData, error: paymentsError } = await query
        .order("due_date", { ascending: false });

      if (paymentsError) throw paymentsError;
      setPayments(paymentsData || []);
    } catch (error) {
      console.error("Error fetching payments:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not fetch payments",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, statusFilter]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  return {
    payments,
    isLoading,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    fetchPayments,
  };
};
