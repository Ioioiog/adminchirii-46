
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DateRange } from "react-day-picker";
import { Invoice } from "@/types/invoice";
import { useUserRole } from "@/hooks/use-user-role";

// Define a type for the valid invoice status values
type InvoiceStatus = "pending" | "paid" | "overdue";

export const useInvoices = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const { userRole, userId } = useUserRole();

  const fetchInvoices = async () => {
    try {
      setIsLoading(true);
      console.log("Fetching invoices with userRole:", userRole, "userId:", userId);
      
      // Check if user is authenticated before proceeding
      if (!userId) {
        console.log("No user found, skipping invoice fetch");
        setInvoices([]);
        return;
      }

      let query = supabase
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
        `);
      
      // Apply user role filters
      if (userRole === 'tenant') {
        query = query.eq('tenant_id', userId);
      } else if (userRole === 'landlord') {
        query = query.eq('landlord_id', userId);
      }
      
      // Apply status filter if not "all"
      if (statusFilter !== "all") {
        // Make sure we only pass valid status values to the query
        const validStatus = statusFilter as InvoiceStatus;
        query = query.eq('status', validStatus);
      }
      
      // Apply date range filter if available
      if (dateRange?.from && dateRange?.to) {
        const fromDate = dateRange.from.toISOString().split('T')[0];
        const toDate = dateRange.to.toISOString().split('T')[0];
        query = query
          .gte('due_date', fromDate)
          .lte('due_date', toDate);
      }
      
      // Apply search term filter if available
      if (searchTerm) {
        // This is a simplistic approach - you may need to adjust based on your needs
        query = query.or(`tenant.first_name.ilike.%${searchTerm}%,tenant.last_name.ilike.%${searchTerm}%,property.name.ilike.%${searchTerm}%`);
      }
      
      const { data: invoicesData, error: invoicesError } = await query
        .order("due_date", { ascending: false });

      if (invoicesError) throw invoicesError;

      console.log("Fetched invoices:", invoicesData);
      setInvoices(invoicesData as Invoice[]);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      // Only show toast if we actually tried to fetch (user exists)
      if (userId) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not fetch invoices",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Only attempt to fetch invoices if userId is available
    if (userId) {
      fetchInvoices();
      
      // Set up real-time subscription for invoices table
      const channel = supabase
        .channel('invoices_changes')
        .on(
          'postgres_changes',
          {
            event: '*', // Listen to all changes (INSERT, UPDATE, DELETE)
            schema: 'public',
            table: 'invoices'
          },
          (payload) => {
            console.log('Invoice change detected:', payload);
            fetchInvoices(); // Refresh the data
          }
        )
        .subscribe();

      // Cleanup subscription when component unmounts
      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      // Reset invoices and loading state if no user
      setInvoices([]);
      setIsLoading(false);
    }
  }, [userId, userRole, statusFilter, searchTerm, dateRange]);

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
