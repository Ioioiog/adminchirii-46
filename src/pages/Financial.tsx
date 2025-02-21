
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
import { DateRange } from "react-day-picker";
import { useProperties } from "@/hooks/useProperties";

type FinancialSection = 'invoices' | 'payments';

const Financial = () => {
  const [activeSection, setActiveSection] = useState<FinancialSection>('invoices');
  const { userRole, userId } = useUserRole();
  const { properties } = useProperties({ userRole: userRole || 'tenant' });
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const {
    payments,
    isLoading: isPaymentsLoading,
    statusFilter: paymentStatusFilter,
    setStatusFilter: setPaymentStatusFilter,
    searchQuery: paymentSearchQuery,
    setSearchQuery: setPaymentSearchQuery,
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

  // Filter out service providers from accessing financial features
  const filteredUserRole = userRole === 'service_provider' ? null : userRole;

  const renderSection = () => {
    if (userRole === 'service_provider') {
      return (
        <div className="text-center p-8">
          <h3 className="text-lg font-semibold text-gray-900">Access Denied</h3>
          <p className="text-gray-500">Service providers do not have access to financial features.</p>
        </div>
      );
    }

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
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                  dateRange={dateRange}
                  setDateRange={setDateRange}
                />
              }
            />
            {filteredUserRole && (
              <InvoiceList
                invoices={invoices}
                userRole={filteredUserRole}
                onStatusUpdate={fetchInvoices}
              />
            )}
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
                  searchQuery={paymentSearchQuery}
                  onSearchChange={setPaymentSearchQuery}
                  status={paymentStatusFilter}
                  onStatusChange={setPaymentStatusFilter}
                  dateRange={dateRange}
                  onDateRangeChange={setDateRange}
                  properties={properties}
                />
              }
            />
            {userRole && userId && (
              <PaymentList 
                payments={payments}
                isLoading={isPaymentsLoading}
                userRole={userRole}
                userId={userId}
                propertyFilter=""
                statusFilter={paymentStatusFilter}
                searchTerm={paymentSearchQuery}
              />
            )}
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
