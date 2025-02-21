
import { Card } from "@/components/ui/card";

interface LandlordDashboardProps {
  userId: string;
  userName: string;
}

export function LandlordDashboard({ userId, userName }: LandlordDashboardProps) {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="page-title">Welcome back, {userName}</h1>
        <p className="page-description">
          Manage your properties and tenants from your personalized dashboard.
        </p>
      </div>

      <div className="card-grid">
        <Card className="glass-card p-6">
          <h3 className="text-xl font-semibold mb-2 gradient-text">Properties</h3>
          <p className="text-gray-300">View and manage your property portfolio</p>
        </Card>

        <Card className="glass-card p-6">
          <h3 className="text-xl font-semibold mb-2 gradient-text">Tenants</h3>
          <p className="text-gray-300">Monitor tenant activities and contracts</p>
        </Card>

        <Card className="glass-card p-6">
          <h3 className="text-xl font-semibold mb-2 gradient-text">Payments</h3>
          <p className="text-gray-300">Track rent payments and financial records</p>
        </Card>

        <Card className="glass-card p-6">
          <h3 className="text-xl font-semibold mb-2 gradient-text">Maintenance</h3>
          <p className="text-gray-300">Handle maintenance requests and repairs</p>
        </Card>
      </div>
    </div>
  );
}
