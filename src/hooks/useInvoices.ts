import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DateRange } from "react-day-picker";
import { Invoice } from "@/types/invoice";

export const useInvoices = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const fetchInvoices = async () => {
    try {
      console.log("Fetching invoices...");
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("No user found");
      }

      const query = supabase
        .from("invoices")
        .select(`
          *,
          property:properties (
            name,
            address
          ),
          tenant:profiles!invoices_tenant_id_fkey (
            first_name,
            last_name,
            email
          )
        `)
        .order("due_date", { ascending: false });

      const { data: invoicesData, error: invoicesError } = await query;

      if (invoicesError) throw invoicesError;

      console.log("Fetched invoices:", invoicesData);
      setInvoices(invoicesData);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not fetch invoices",
      });
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  return {
    invoices,
    isLoading,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    dateRange,
    setDateRange,
    fetchInvoices,
  };
};