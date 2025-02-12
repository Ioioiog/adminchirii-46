
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { HelpCircle } from "lucide-react";

export default function Info() {
  return (
    <DashboardLayout>
      <div className="container py-6 space-y-8">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-6 w-6 text-blue-500" />
          <h1 className="text-2xl font-semibold">Information</h1>
        </div>
        
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
          <div className="rounded-lg border bg-card p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
            <h2 className="text-lg font-semibold mb-4">About the Platform</h2>
            <p className="text-muted-foreground">
              Welcome to our property management platform. This system helps landlords, tenants, and service providers 
              manage their properties and maintenance requests efficiently.
            </p>
          </div>
          
          <div className="rounded-lg border bg-card p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
            <h2 className="text-lg font-semibold mb-4">Getting Started</h2>
            <p className="text-muted-foreground">
              Depending on your role, you can access different features:
            </p>
            <ul className="list-disc list-inside mt-2 text-muted-foreground space-y-1">
              <li>Property management</li>
              <li>Maintenance requests</li>
              <li>Document storage</li>
              <li>Financial tracking</li>
            </ul>
          </div>
          
          <div className="rounded-lg border bg-card p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
            <h2 className="text-lg font-semibold mb-4">Need Help?</h2>
            <p className="text-muted-foreground">
              If you need assistance or have questions about using the platform, please visit the settings 
              page or contact our support team.
            </p>
          </div>
          
          <div className="rounded-lg border bg-card p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
            <h2 className="text-lg font-semibold mb-4">Updates & News</h2>
            <p className="text-muted-foreground">
              Stay tuned for regular updates and new features. We're constantly improving the platform 
              based on user feedback.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
