
import { useState } from "react";
import { DollarSign, FileText, CreditCard } from "lucide-react";
import { InvoiceList } from "@/components/invoices/InvoiceList";
import { PaymentList } from "@/components/payments/PaymentList";
import { InvoiceDialog } from "@/components/invoices/InvoiceDialog";
import { PaymentDialog } from "@/components/payments/PaymentDialog";
import { InvoiceFilters } from "@/components/invoices/InvoiceFilters";
import { PaymentFilters } from "@/components/payments/PaymentFilters";
import { useUserRole } from "@/hooks/use-user-role";
import { usePayments } from "@/hooks/usePayments";
import { useInvoices } from "@/hooks/useInvoices";
import { PageLayout } from "@/components/layout/PageLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { NavigationTabs } from "@/components/layout/NavigationTabs";
import { ContentCard } from "@/components/layout/ContentCard";
import { SearchAndFilterBar } from "@/components/layout/SearchAndFilterBar";

type FinancialSection = 'invoices' | 'payments';

const Financial = () => {
  const [activeSection, setActiveSection] = useState<FinancialSection>('invoices');
  const { userRole } = useUserRole();
  const {
    payments,
    isLoading: isPaymentsLoading,
    statusFilter: paymentStatusFilter,
    setStatusFilter: setPaymentStatusFilter,
    searchQuery: paymentSearchQuery,
    setSearchQuery: setPaymentSearchQuery,
    dateRange: paymentDateRange,
    setDateRange: setPaymentDateRange,
    fetchPayments
  } = usePayments();

  const {
    invoices,
    isLoading: isInvoicesLoading,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    dateRange,
    setDateRange,
    fetchInvoices
  } = useInvoices();

  const navigationItems = [
    {
      id: 'invoices',
      label: 'Invoices',
      icon: FileText,
    },
    {
      id: 'payments',
      label: 'Payments',
      icon: CreditCard,
    },
  ];

  const renderSection = () => {
    switch (activeSection) {
      case 'invoices':
        return (
          <div className="space-y-6">
            <PageHeader
              icon={FileText}
              title="Invoices"
              description="Manage and track all your property-related invoices"
            />
            <SearchAndFilterBar
              searchPlaceholder="Search invoices..."
              searchValue={searchTerm}
              onSearchChange={setSearchTerm}
              filterContent={
                <InvoiceFilters
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                  dateRange={dateRange}
                  setDateRange={setDateRange}
                />
              }
            />
            <InvoiceList
              invoices={invoices}
              userRole={userRole}
              onStatusUpdate={fetchInvoices}
            />
          </div>
        );
      case 'payments':
        return (
          <div className="space-y-6">
            <PageHeader
              icon={DollarSign}
              title="Payments"
              description="Track and manage all property-related payments"
            />
            <SearchAndFilterBar
              searchPlaceholder="Search payments..."
              searchValue={paymentSearchQuery}
              onSearchChange={setPaymentSearchQuery}
              filterContent={
                <PaymentFilters
                  status={paymentStatusFilter}
                  onStatusChange={setPaymentStatusFilter}
                  dateRange={paymentDateRange}
                  onDateRangeChange={setPaymentDateRange}
                />
              }
            />
            <PaymentList payments={payments} userRole={userRole} />
          </div>
        );
    }
  };

  return (
    <PageLayout>
      <NavigationTabs
        tabs={navigationItems}
        activeTab={activeSection}
        onTabChange={(id) => setActiveSection(id as FinancialSection)}
      />
      <ContentCard>
        {renderSection()}
      </ContentCard>
    </PageLayout>
  );
};

export default Financial;
