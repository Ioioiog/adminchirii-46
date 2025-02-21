
import { Card } from "@/components/ui/card";

interface ServiceProviderDashboardProps {
  userId: string;
  userName: string;
}

export function ServiceProviderDashboard({ userId, userName }: ServiceProviderDashboardProps) {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="page-title">Welcome back, {userName}</h1>
        <p className="page-description">
          Manage your services and track maintenance requests from your dashboard.
        </p>
      </div>

      <div className="card-grid">
        <Card className="glass-card p-6">
          <h3 className="text-xl font-semibold mb-2 gradient-text">Work Orders</h3>
          <p className="text-gray-300">View and manage maintenance requests</p>
        </Card>

        <Card className="glass-card p-6">
          <h3 className="text-xl font-semibold mb-2 gradient-text">Services</h3>
          <p className="text-gray-300">Manage your service offerings</p>
        </Card>

        <Card className="glass-card p-6">
          <h3 className="text-xl font-semibold mb-2 gradient-text">Schedule</h3>
          <p className="text-gray-300">View your upcoming appointments</p>
        </Card>

        <Card className="glass-card p-6">
          <h3 className="text-xl font-semibold mb-2 gradient-text">Payments</h3>
          <p className="text-gray-300">Track earnings and payment history</p>
        </Card>
      </div>
    </div>
  );
}
