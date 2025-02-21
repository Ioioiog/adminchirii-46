
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
    <div className="h-screen overflow-y-auto p-6 space-y-4 max-w-7xl mx-auto">
      {/* Header Section */}
      <section className="glass-card p-4 transition-all duration-200 animate-fade-in">
        <DashboardHeader userName={userName} />
      </section>

      {/* Metrics Section */}
      <section className="glass-card p-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <DashboardMetrics userId={userId} userRole="landlord" />
      </section>

      {/* Calendar Section */}
      <section className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <CalendarSection />
      </section>

      {/* Revenue Section */}
      <section className="glass-card p-6 transition-all duration-200 animate-fade-in" style={{ animationDelay: '0.3s' }}>
        <div className="space-y-6">
          <div className="border-b border-glass-border pb-5">
            <div className="mt-4 flex flex-wrap gap-3">
              <RevenueSection userId={userId} />
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Income Section */}
      <section className="glass-card p-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
        <UpcomingIncomeSection userId={userId} />
      </section>
    </div>
  );
}
