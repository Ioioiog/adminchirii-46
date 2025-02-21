
import { useState } from "react";
import { PaymentList } from "@/components/payments/PaymentList";
import { PaymentFilters } from "@/components/payments/PaymentFilters";
import { useUserRole } from "@/hooks/use-user-role";
import { usePayments } from "@/hooks/usePayments";
import { PageLayout } from "@/components/layout/PageLayout";
import { ContentCard } from "@/components/layout/ContentCard";
import { SearchAndFilterBar } from "@/components/layout/SearchAndFilterBar";
import { DateRange } from "react-day-picker";

const Payments = () => {
  const { userRole, userId } = useUserRole();
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const {
    payments,
    isLoading,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
  } = usePayments();

  // Early return if user is not authenticated or is a service provider
  if (!userRole || !userId || userRole === 'service_provider') {
    return null;
  }

  // Cast userRole to "landlord" | "tenant" since we've already filtered out service_provider
  const filteredUserRole = userRole as "landlord" | "tenant";

  return (
    <PageLayout>
      <ContentCard>
        <SearchAndFilterBar
          searchPlaceholder="Search payments..."
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          filterContent={
            <PaymentFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              status={statusFilter}
              onStatusChange={setStatusFilter}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              properties={[]}
            />
          }
        />
        <PaymentList
          payments={payments}
          isLoading={isLoading}
          userRole={filteredUserRole}
          userId={userId}
          propertyFilter=""
          statusFilter={statusFilter}
          searchTerm={searchQuery}
        />
      </ContentCard>
    </PageLayout>
  );
};

export default Payments;
