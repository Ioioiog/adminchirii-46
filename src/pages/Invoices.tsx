
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { InvoiceList } from "@/components/invoices/InvoiceList";
import { InvoiceDialog } from "@/components/invoices/InvoiceDialog";
import { InvoiceFilters } from "@/components/invoices/InvoiceFilters";
import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useUserRole } from "@/hooks/use-user-role";
import { useInvoices } from "@/hooks/useInvoices";

const Invoices = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const { userRole, userId } = useUserRole();

  const {
    invoices,
    isLoading,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    dateRange,
    setDateRange,
    fetchInvoices
  } = useInvoices();

  if (!userId || !userRole || userRole === 'service_provider') {
    return null;
  }

  return (
    <div className="flex bg-[#F8F9FC] min-h-screen">
      <DashboardSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-2xl font-semibold">Invoices</h1>
              {userRole === "landlord" && (
                <Button onClick={() => setShowAddModal(true)}>
                  Create Invoice
                </Button>
              )}
            </div>

            <InvoiceFilters
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              dateRange={dateRange}
              setDateRange={setDateRange}
            />

            <ScrollArea className="h-[calc(100vh-300px)]">
              <InvoiceList
                invoices={invoices}
                userRole={userRole}
                onStatusUpdate={fetchInvoices}
              />
            </ScrollArea>
          </div>
        </div>
      </main>

      <InvoiceDialog
        onOpenChange={setShowAddModal}
        userId={userId}
        userRole={userRole}
        onInvoiceCreated={fetchInvoices}
      />
    </div>
  );
};

export default Invoices;
