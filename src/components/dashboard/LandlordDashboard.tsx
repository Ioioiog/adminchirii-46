
import { DashboardHeader } from "./sections/DashboardHeader";
import { DashboardMetrics } from "./DashboardMetrics";
import { RevenueSection } from "./sections/RevenueSection";
import { UpcomingIncomeSection } from "./sections/UpcomingIncomeSection";
import { CalendarSection } from "./sections/CalendarSection";
import { useTranslation } from "react-i18next";

interface LandlordDashboardProps {
  userId: string;
  userName: string;
}

export function LandlordDashboard({ userId, userName }: LandlordDashboardProps) {
  const { t } = useTranslation('dashboard');
  
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Section */}
      <section className="bg-white rounded-xl shadow-sm p-6 transition-all duration-200 hover:shadow-md">
        <DashboardHeader userName={userName} />
      </section>

      {/* Metrics Section */}
      <section className="bg-white rounded-xl shadow-sm p-6">
        <DashboardMetrics userId={userId} userRole="landlord" />
      </section>

      {/* Calendar Section */}
      <section>
        <CalendarSection />
      </section>

      {/* Revenue Section */}
      <section className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg p-6 transition-all duration-200 hover:shadow-xl">
        <div className="space-y-6">
          <div className="border-b border-gray-100 pb-5">
            <h2 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
              {t('revenue.title')}
            </h2>
            <div className="mt-4 flex flex-wrap gap-3">
              <RevenueSection userId={userId} />
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Income Section */}
      <section className="bg-white rounded-xl shadow-sm p-6">
        <UpcomingIncomeSection userId={userId} />
      </section>
    </div>
  );
}
