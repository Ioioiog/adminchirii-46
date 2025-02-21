
import { Card } from "@/components/ui/card";

interface TenantDashboardProps {
  userId: string;
  userName: string;
  tenantInfo: any;
}

export function TenantDashboard({ userId, userName, tenantInfo }: TenantDashboardProps) {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="page-title">Welcome back, {userName}</h1>
        <p className="page-description">
          Manage your tenancy and access important information from your dashboard.
        </p>
      </div>

      <div className="card-grid">
        <Card className="glass-card p-6">
          <h3 className="text-xl font-semibold mb-2 gradient-text">Rent Payments</h3>
          <p className="text-gray-300">View and manage your rent payments</p>
        </Card>

        <Card className="glass-card p-6">
          <h3 className="text-xl font-semibold mb-2 gradient-text">Maintenance</h3>
          <p className="text-gray-300">Submit and track maintenance requests</p>
        </Card>

        <Card className="glass-card p-6">
          <h3 className="text-xl font-semibold mb-2 gradient-text">Documents</h3>
          <p className="text-gray-300">Access important documents and contracts</p>
        </Card>

        <Card className="glass-card p-6">
          <h3 className="text-xl font-semibold mb-2 gradient-text">Messages</h3>
          <p className="text-gray-300">Communicate with your landlord</p>
        </Card>
      </div>
    </div>
  );
}
