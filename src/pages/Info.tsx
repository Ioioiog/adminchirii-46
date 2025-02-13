
import { BookOpen, HelpCircle } from "lucide-react";
import { useAuthState } from "@/hooks/useAuthState";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function InfoPage() {
  const { isLoading, isAuthenticated } = useAuthState();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
        <div className="container py-12">
          <div className="flex items-center gap-3 mb-6">
            <HelpCircle size={32} className="text-blue-500" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome to Our Platform</h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
            Your comprehensive solution for property management. We bring together landlords, 
            tenants, and service providers in one seamless platform.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-12 space-y-12">
        {/* Feature Cards */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border bg-card p-8 shadow-sm hover:shadow-md transition-all duration-200">
            <BookOpen size={40} className="text-blue-500 mb-4" />
            <h2 className="text-xl font-semibold mb-4">About the Platform</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our property management platform streamlines the entire rental process. 
              From maintenance requests to financial tracking, we've got you covered 
              with powerful tools and intuitive interfaces.
            </p>
          </div>
          
          <div className="rounded-xl border bg-card p-8 shadow-sm hover:shadow-md transition-all duration-200">
            <HelpCircle size={40} className="text-green-500 mb-4" />
            <h2 className="text-xl font-semibold mb-4">Getting Started</h2>
            <p className="text-muted-foreground mb-4">
              Access a comprehensive suite of features tailored to your role:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                Property management & tracking
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                Maintenance request system
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                Secure document storage
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                Financial tracking & reporting
              </li>
            </ul>
          </div>
          
          <div className="rounded-xl border bg-card p-8 shadow-sm hover:shadow-md transition-all duration-200">
            <HelpCircle size={40} className="text-purple-500 mb-4" />
            <h2 className="text-xl font-semibold mb-4">Need Help?</h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Our support team is here to help you get the most out of your experience. 
              Whether you have questions about features or need technical assistance, 
              we're just a click away.
            </p>
            <Button variant="outline" className="w-full">
              Contact Support
            </Button>
          </div>
        </div>

        {/* Updates Section */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 rounded-xl p-8">
          <h2 className="text-2xl font-semibold mb-4">Latest Updates</h2>
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
              <div className="text-sm text-blue-500 mb-1">New Feature</div>
              <h3 className="font-medium mb-2">Enhanced Document Management</h3>
              <p className="text-muted-foreground text-sm">
                We've improved our document storage system with better organization and faster search capabilities.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
              <div className="text-sm text-green-500 mb-1">Improvement</div>
              <h3 className="font-medium mb-2">Maintenance Request Updates</h3>
              <p className="text-muted-foreground text-sm">
                Real-time tracking and notifications for maintenance requests are now available.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
