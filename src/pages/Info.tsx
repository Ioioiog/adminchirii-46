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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section with 3D effect */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-500/10 to-indigo-500/10 backdrop-blur-xl border border-white/10 dark:border-white/5">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]" />
        <div className="container py-16 relative">
          <div className="flex items-center gap-4 mb-8 animate-fade-in">
            <div className="p-3 rounded-2xl bg-blue-500/10 backdrop-blur-xl border border-blue-500/20 shadow-lg transform hover:scale-105 transition-all">
              <img 
                src="/lovable-uploads/9c23bc1b-4e8c-433e-a961-df606dc6a2c6.png" 
                alt="AdminChirii.ro Logo" 
                className="h-8 w-8 rounded-lg"
              />
            </div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
              Welcome to Our Platform
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl leading-relaxed animate-fade-in">
            Your comprehensive solution for property management. We bring together landlords, 
            tenants, and service providers in one seamless platform.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-16 space-y-16">
        {/* Feature Cards with 3D effect */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="group rounded-2xl bg-white/70 dark:bg-gray-800/50 backdrop-blur-xl border border-white/20 dark:border-white/10 p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="p-3 rounded-2xl bg-blue-500/10 backdrop-blur-xl border border-blue-500/20 shadow-lg w-fit mb-6 group-hover:scale-110 transition-transform">
              <BookOpen size={40} className="text-blue-500" />
            </div>
            <h2 className="text-xl font-semibold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
              About the Platform
            </h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Our property management platform streamlines the entire rental process. 
              From maintenance requests to financial tracking, we've got you covered.
            </p>
          </div>
          
          <div className="group rounded-2xl bg-white/70 dark:bg-gray-800/50 backdrop-blur-xl border border-white/20 dark:border-white/10 p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="p-3 rounded-2xl bg-green-500/10 backdrop-blur-xl border border-green-500/20 shadow-lg w-fit mb-6 group-hover:scale-110 transition-transform">
              <HelpCircle size={40} className="text-green-500" />
            </div>
            <h2 className="text-xl font-semibold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400">
              Getting Started
            </h2>
            <ul className="space-y-3 text-gray-600 dark:text-gray-300">
              {["Property management & tracking", "Maintenance request system", "Secure document storage", "Financial tracking & reporting"].map((feature, index) => (
                <li key={index} className="flex items-center gap-3 group/item">
                  <div className="h-2 w-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 group-hover/item:scale-150 transition-transform" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="group rounded-2xl bg-white/70 dark:bg-gray-800/50 backdrop-blur-xl border border-white/20 dark:border-white/10 p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="p-3 rounded-2xl bg-purple-500/10 backdrop-blur-xl border border-purple-500/20 shadow-lg w-fit mb-6 group-hover:scale-110 transition-transform">
              <HelpCircle size={40} className="text-purple-500" />
            </div>
            <h2 className="text-xl font-semibold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400">
              Need Help?
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
              Our support team is here to help you get the most out of your experience. 
              We're just a click away.
            </p>
            <Button variant="outline" className="w-full bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl border-purple-500/20 hover:border-purple-500/40 hover:bg-purple-500/10 transition-all duration-300">
              Contact Support
            </Button>
          </div>
        </div>

        {/* Updates Section with glass effect */}
        <div className="rounded-2xl bg-gradient-to-br from-blue-500/5 to-indigo-500/5 backdrop-blur-xl border border-white/10 p-8 shadow-xl">
          <h2 className="text-2xl font-semibold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
            Latest Updates
          </h2>
          <div className="space-y-4">
            {[
              {
                type: "New Feature",
                title: "Enhanced Document Management",
                description: "We've improved our document storage system with better organization and faster search capabilities.",
                color: "blue"
              },
              {
                type: "Improvement",
                title: "Maintenance Request Updates",
                description: "Real-time tracking and notifications for maintenance requests are now available.",
                color: "green"
              }
            ].map((update, index) => (
              <div key={index} className="group rounded-xl bg-white/50 dark:bg-gray-800/30 backdrop-blur-xl border border-white/20 p-4 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className={`text-sm text-${update.color}-500 font-medium mb-1`}>{update.type}</div>
                <h3 className="font-medium mb-2 text-gray-900 dark:text-white">{update.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">{update.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
