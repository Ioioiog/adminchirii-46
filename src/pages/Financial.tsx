
import { useState, useEffect } from "react";
import { DollarSign, FileText, CreditCard, BarChart2, Building, Calculator } from "lucide-react";
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
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { useCurrency } from "@/hooks/useCurrency";
import { startOfMonth, endOfMonth } from "date-fns";
import CostCalculator from "@/components/financial/CostCalculator";
import FinancialSummaryCard from "@/components/financial/FinancialSummaryCard";

type FinancialSection = 'invoices' | 'payments' | 'overview';

interface FinancialSummary {
  totalInvoiced: number;
  totalPaid: number;
  outstandingAmount: number;
  overduePendingAmount: number;
}

const Financial = () => {
  const [activeSection, setActiveSection] = useState<FinancialSection>('overview');
  const { userRole, userId } = useUserRole();
  const { formatAmount, currency } = useCurrency();
  const { properties } = useProperties({ userRole: userRole || 'tenant' });
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);

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

  const calculateFinancialSummary = (): FinancialSummary => {
    const currentDate = new Date();
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);

    const currentMonthInvoices = invoices.filter(invoice => {
      const invoiceDate = new Date(invoice.created_at);
      return invoiceDate >= monthStart && invoiceDate <= monthEnd;
    });

    const totalInvoiced = currentMonthInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);
    const totalPaid = currentMonthInvoices
      .filter(invoice => invoice.status === 'paid')
      .reduce((sum, invoice) => sum + invoice.amount, 0);
    const outstandingAmount = currentMonthInvoices
      .filter(invoice => invoice.status === 'pending')
      .reduce((sum, invoice) => sum + invoice.amount, 0);
    const overduePendingAmount = currentMonthInvoices
      .filter(invoice => 
        invoice.status === 'pending' && 
        new Date(invoice.due_date) < currentDate
      )
      .reduce((sum, invoice) => sum + invoice.amount, 0);

    return {
      totalInvoiced,
      totalPaid,
      outstandingAmount,
      overduePendingAmount
    };
  };

  const financialSummary = calculateFinancialSummary();

  const navigationItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: BarChart2,
    },
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

  const filteredUserRole = userRole === 'service_provider' ? null : userRole;
  const isLandlordOrTenant = userRole === 'landlord' || userRole === 'tenant';

  useEffect(() => {
    console.log("Financial component invoices:", invoices);
    console.log("User role:", userRole, "User ID:", userId);
  }, [invoices, userRole, userId]);

  const renderOverviewSection = () => {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={BarChart2}
          title="Financial Overview"
          description="Summary of your financial activities for the current month"
        />
        
        {isLandlordOrTenant && (
          <Card>
            <CardContent className="pt-6">
              <CostCalculator />
            </CardContent>
          </Card>
        )}
        
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <FinancialSummaryCard
            title="This Month's Total"
            amount={formatAmount(financialSummary.totalInvoiced, currency)}
            description="Total invoiced this month"
            icon={DollarSign}
            color="default"
            currencyCode={currency}
          />

          <FinancialSummaryCard
            title="Month's Paid Amount"
            amount={formatAmount(financialSummary.totalPaid, currency)}
            description="Total paid this month"
            icon={DollarSign}
            color="green"
            currencyCode={currency}
          />

          <FinancialSummaryCard
            title="Month's Outstanding"
            amount={formatAmount(financialSummary.outstandingAmount, currency)}
            description="Pending payments this month"
            icon={DollarSign}
            color="yellow"
            currencyCode={currency}
          />

          <FinancialSummaryCard
            title="Month's Overdue"
            amount={formatAmount(financialSummary.overduePendingAmount, currency)}
            description="Overdue payments this month"
            icon={DollarSign}
            color="red"
            currencyCode={currency}
          />
        </div>

        {userRole === 'tenant' && (
          <Card>
            <CardHeader>
              <h3 className="text-lg font-medium">Property Information</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {properties.map((property) => (
                  <div key={property.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <Building className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <h4 className="font-medium">{property.name}</h4>
                      <p className="text-sm text-muted-foreground">{property.address}</p>
                      <p className="text-sm mt-1">
                        Monthly Rent: {formatAmount(property.monthly_rent)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderSection = () => {
    if (!isLandlordOrTenant) {
      return (
        <div className="text-center p-8">
          <h3 className="text-lg font-semibold text-gray-900">Access Denied</h3>
          <p className="text-gray-500">Service providers do not have access to financial features.</p>
        </div>
      );
    }

    switch (activeSection) {
      case 'overview':
        return renderOverviewSection();
      case 'invoices':
        return (
          <div className="space-y-6">
            <PageHeader
              icon={FileText}
              title="Invoices"
              description="Manage and track all your property-related invoices"
            />
            <div className="flex justify-between items-center">
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
            </div>
            {isInvoicesLoading ? (
              <div className="flex justify-center p-8">
                <p>Loading invoices...</p>
              </div>
            ) : filteredUserRole && (
              <InvoiceList
                invoices={invoices}
                userRole={filteredUserRole}
                onStatusUpdate={fetchInvoices}
              />
            )}
            {showInvoiceDialog && userId && filteredUserRole && (
              <InvoiceDialog 
                open={showInvoiceDialog}
                onOpenChange={(open) => {
                  if (open) {
                    console.log('Opening invoice dialog. User currency settings:', {
                      userRole,
                      userId,
                    });
                  }
                  setShowInvoiceDialog(open);
                }}
                userId={userId}
                userRole={filteredUserRole}
                onInvoiceCreated={fetchInvoices}
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
            {userRole && userId && isLandlordOrTenant && (
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
      default:
        return null;
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
