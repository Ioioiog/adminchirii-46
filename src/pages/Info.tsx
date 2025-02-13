import { BookOpen, HelpCircle } from "lucide-react";
import { useAuthState } from "@/hooks/useAuthState";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function InfoPage() {
  const { isLoading, isAuthenticated } = useAuthState();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute h-64 w-32 bg-gradient-to-b from-blue-500/20 to-indigo-500/20 rounded-t-lg transform -skew-x-12 animate-float-1 left-[10%] top-[20%]">
            <div className="absolute inset-x-2 top-2 bottom-0 bg-gradient-to-b from-white/10 to-transparent grid grid-cols-3 gap-2 p-2">
              {Array.from({ length: 15 }).map((_, i) => (
                <div key={i} className="bg-white/20 rounded-sm" />
              ))}
            </div>
          </div>
          <div className="absolute h-80 w-40 bg-gradient-to-b from-purple-500/20 to-pink-500/20 rounded-t-lg transform -skew-x-12 animate-float-2 left-[30%] top-[10%]">
            <div className="absolute inset-x-2 top-2 bottom-0 bg-gradient-to-b from-white/10 to-transparent grid grid-cols-4 gap-2 p-2">
              {Array.from({ length: 24 }).map((_, i) => (
                <div key={i} className="bg-white/20 rounded-sm" />
              ))}
            </div>
          </div>
          <div className="absolute h-72 w-36 bg-gradient-to-b from-green-500/20 to-emerald-500/20 rounded-t-lg transform -skew-x-12 animate-float-3 left-[60%] top-[15%]">
            <div className="absolute inset-x-2 top-2 bottom-0 bg-gradient-to-b from-white/10 to-transparent grid grid-cols-3 gap-2 p-2">
              {Array.from({ length: 18 }).map((_, i) => (
                <div key={i} className="bg-white/20 rounded-sm" />
              ))}
            </div>
          </div>
          <div className="absolute h-96 w-44 bg-gradient-to-b from-cyan-500/20 to-blue-500/20 rounded-t-lg transform -skew-x-12 animate-float-4 left-[80%] top-[5%]">
            <div className="absolute inset-x-2 top-2 bottom-0 bg-gradient-to-b from-white/10 to-transparent grid grid-cols-4 gap-2 p-2">
              {Array.from({ length: 32 }).map((_, i) => (
                <div key={i} className="bg-white/20 rounded-sm" />
              ))}
            </div>
          </div>
          <div className="absolute h-56 w-28 bg-gradient-to-b from-amber-500/20 to-orange-500/20 rounded-t-lg transform -skew-x-12 animate-float-5 left-[45%] top-[25%]">
            <div className="absolute inset-x-2 top-2 bottom-0 bg-gradient-to-b from-white/10 to-transparent grid grid-cols-3 gap-2 p-2">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="bg-white/20 rounded-sm" />
              ))}
            </div>
          </div>
          <div className="absolute h-48 w-24 bg-gradient-to-b from-indigo-500/10 to-violet-500/10 rounded-t-lg transform -skew-x-12 animate-float-6 left-[20%] top-[35%]">
            <div className="absolute inset-x-2 top-2 bottom-0 bg-gradient-to-b from-white/10 to-transparent grid grid-cols-2 gap-2 p-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="bg-white/20 rounded-sm" />
              ))}
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-gray-50/50 to-transparent dark:from-gray-900/50 pointer-events-none" />
        </div>
      </div>

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

      <div className="container py-16 space-y-16 relative z-10">
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
            <ul className="space-y-3 text-gray-600 dark:text-gray-300 mb-6">
              {["Property management & tracking", "Maintenance request system", "Secure document storage", "Financial tracking & reporting"].map((feature, index) => (
                <li key={index} className="flex items-center gap-3 group/item">
                  <div className="h-2 w-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 group-hover/item:scale-150 transition-transform" />
                  {feature}
                </li>
              ))}
            </ul>
            {!isAuthenticated && (
              <Button 
                variant="outline" 
                className="w-full bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl border-green-500/20 hover:border-green-500/40 hover:bg-green-500/10 transition-all duration-300"
                onClick={() => navigate('/auth')}
              >
                Get Started
              </Button>
            )}
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
