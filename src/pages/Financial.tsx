import { useState } from "react";
import { DollarSign, FileText, CreditCard, BarChart2, Building } from "lucide-react";
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
  const { formatAmount } = useCurrency();
  const { properties } = useProperties({ userRole: userRole || 'tenant' });

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

  const renderOverviewSection = () => {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={BarChart2}
          title="Financial Overview"
          description="Summary of your financial activities for the current month"
        />
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">This Month's Total</h3>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatAmount(financialSummary.totalInvoiced)}</div>
              <p className="text-xs text-muted-foreground">
                Total invoiced this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">Month's Paid Amount</h3>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatAmount(financialSummary.totalPaid)}
              </div>
              <p className="text-xs text-muted-foreground">
                Total paid this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">Month's Outstanding</h3>
              <DollarSign className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {formatAmount(financialSummary.outstandingAmount)}
              </div>
              <p className="text-xs text-muted-foreground">
                Pending payments this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">Month's Overdue</h3>
              <DollarSign className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatAmount(financialSummary.overduePendingAmount)}
              </div>
              <p className="text-xs text-muted-foreground">
                Overdue payments this month
              </p>
            </CardContent>
          </Card>
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
