import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, FileText, Download, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { InvoiceList } from "@/components/invoices/InvoiceList";
import { InvoiceDialog } from "@/components/invoices/InvoiceDialog";
import { InvoiceFilters } from "@/components/invoices/InvoiceFilters";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { generateInvoicePDF } from "@/utils/invoiceUtils";
import { saveAs } from 'file-saver';

const Invoices = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<"landlord" | "tenant" | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [propertyFilter, setPropertyFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: properties } = useQuery({
    queryKey: ["properties"],
    queryFn: async () => {
      const { data, error } = await supabase.from("properties").select("id, name");
      if (error) throw error;
      return data;
    },
    enabled: userRole === "landlord",
  });

  const { data: invoices, isLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const { data, error } = await supabase.from("invoices").select(`
          *,
          property:properties (
            name
          )
        `);
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        console.log("No active session found, redirecting to auth");
        navigate("/auth");
        return;
      }

      setUserId(session.user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .maybeSingle();

      if (profile?.role) {
        setUserRole(profile.role as "landlord" | "tenant");
      }
    };

    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Invoices page auth state changed:", event);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  if (!userId || !userRole) return null;

  const filteredInvoices = invoices?.filter((invoice) => {
    const matchesSearch =
      searchTerm === "" ||
      invoice.property?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    const matchesProperty = propertyFilter === "all" || invoice.property_id === propertyFilter;

    return matchesSearch && matchesStatus && matchesProperty;
  });

  const handleDownloadInvoice = async (invoice) => {
    try {
      const pdfBlob = await generateInvoicePDF(invoice);
      saveAs(pdfBlob, `invoice-${invoice.invoice_number}.pdf`);
      toast({
        title: "Success",
        description: "Invoice downloaded successfully",
      });
    } catch (error) {
      console.error("Error generating or downloading PDF:", error);
      toast({
        title: "Error",
        description: "Failed to generate or download invoice",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex bg-[#F8F9FC] min-h-screen">
      <DashboardSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-8">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <h1 className="text-2xl font-semibold">Invoices</h1>
                </div>
                <p className="text-gray-500">
                  Manage and track all your property invoices.
                </p>
              </div>

              {userRole === "landlord" && (
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowAddModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Invoice
                </Button>
              )}
            </div>

            <InvoiceFilters
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              propertyFilter={propertyFilter}
              setPropertyFilter={setPropertyFilter}
              properties={properties}
            />

            <InvoiceList
              invoices={filteredInvoices}
              isLoading={isLoading}
              userRole={userRole}
              onDownloadInvoice={handleDownloadInvoice}
            />
          </div>
        </div>
      </main>

      <InvoiceDialog open={showAddModal} onOpenChange={setShowAddModal} userId={userId} userRole={userRole} />
    </div>
  );
};

export default Invoices;
