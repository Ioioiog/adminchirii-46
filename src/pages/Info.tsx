
import { BookOpen, HelpCircle, Building2, Users, Key, MessageSquare } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 relative overflow-hidden perspective-1000">
      {/* Animated Particles Background */}
      <div className="absolute inset-0 opacity-20">
        {Array.from({ length: 50 }).map((_, i) => (
          <div 
            key={i}
            className="absolute w-1 h-1 bg-blue-400 rounded-full animate-float-1"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 5}s`
            }}
          />
        ))}
      </div>

      {/* Dynamic 3D Buildings */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0">
          {Array.from({ length: 8 }).map((_, i) => {
            const height = 200 + Math.random() * 300;
            const width = 60 + Math.random() * 40;
            return (
              <div 
                key={i}
                className={`absolute bottom-0 bg-gradient-to-t from-blue-500/20 to-purple-500/20 rounded-t-lg transform -skew-x-12 ${`animate-float-${(i % 6) + 1}`}`}
                style={{
                  height: `${height}px`,
                  width: `${width}px`,
                  left: `${(i * 15) + Math.random() * 5}%`,
                }}
              >
                <div className="absolute inset-x-2 top-2 bottom-0 bg-gradient-to-b from-white/10 to-transparent grid grid-cols-3 gap-1 p-2">
                  {Array.from({ length: Math.floor(height / 20) }).map((_, j) => (
                    <div 
                      key={j} 
                      className="bg-white/20 rounded-sm"
                      style={{
                        opacity: Math.random() > 0.5 ? 0.8 : 0.2
                      }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 to-transparent" />
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative">
        <div className="container mx-auto px-6 pt-32 pb-20">
          <div className="flex flex-col items-center text-center space-y-8 animate-fade-in">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full blur opacity-40 group-hover:opacity-75 transition duration-1000"></div>
              <div className="relative p-6 bg-black/30 rounded-full backdrop-blur-xl border border-white/10">
                <img 
                  src="/lovable-uploads/9c23bc1b-4e8c-433e-a961-df606dc6a2c6.png" 
                  alt="AdminChirii.ro Logo" 
                  className="w-16 h-16 transform group-hover:scale-110 transition-transform duration-300"
                />
              </div>
            </div>
            <h1 className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 tracking-tight">
              Welcome to the Future of<br />Property Management
            </h1>
            <p className="text-xl text-blue-100/80 max-w-2xl">
              Experience a revolutionary platform that brings together landlords, tenants, and service providers 
              in one seamless, intelligent ecosystem.
            </p>
            {!isAuthenticated && (
              <Button 
                onClick={() => navigate('/auth')}
                className="relative group px-8 py-6 text-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 hover:from-blue-500/20 hover:to-purple-500/20 backdrop-blur-xl border border-white/10 hover:border-white/20 text-white shadow-lg hover:shadow-blue-500/20 transition-all duration-300"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 blur transition-opacity duration-300" />
                <span className="relative">Get Started Now</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative z-10 container mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              title: "Smart Property Management",
              description: "Automate and streamline your property operations with AI-driven insights and real-time analytics.",
              icon: Building2,
              gradient: "from-blue-600 to-cyan-600"
            },
            {
              title: "Seamless Communication",
              description: "Connect instantly with tenants and service providers through our secure messaging platform.",
              icon: MessageSquare,
              gradient: "from-purple-600 to-pink-600"
            },
            {
              title: "Secure Access Control",
              description: "Manage digital keys and access permissions with our advanced security system.",
              icon: Key,
              gradient: "from-emerald-600 to-teal-600"
            }
          ].map((feature, index) => (
            <div 
              key={index}
              className="group relative"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur opacity-50 group-hover:opacity-100 transition duration-500" />
              <div className="relative h-full p-8 bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-white/10 transition-transform duration-300 group-hover:-translate-y-2">
                <div className={`inline-flex p-4 rounded-xl bg-gradient-to-r ${feature.gradient} bg-opacity-10 backdrop-blur-xl mb-6`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">{feature.title}</h3>
                <p className="text-blue-100/70">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Updates Section */}
      <div className="relative z-10 container mx-auto px-6 pb-20">
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur opacity-50" />
          <div className="relative p-8 bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-white/10">
            <h2 className="text-3xl font-bold text-white mb-8">Latest Updates</h2>
            <div className="space-y-6">
              {[
                {
                  type: "New Feature",
                  title: "AI-Powered Property Insights",
                  description: "Get intelligent recommendations and market analysis for your properties.",
                  gradient: "from-blue-600 to-cyan-600"
                },
                {
                  type: "Enhancement",
                  title: "Smart Contract Integration",
                  description: "Automated contract generation and digital signing capabilities added.",
                  gradient: "from-purple-600 to-pink-600"
                }
              ].map((update, index) => (
                <div 
                  key={index}
                  className="relative group"
                >
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl blur opacity-30 group-hover:opacity-50 transition duration-300" />
                  <div className="relative p-6 bg-gray-900/30 backdrop-blur-xl rounded-xl border border-white/5 group-hover:border-white/10 transition-all duration-300">
                    <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r ${update.gradient} bg-opacity-10 text-white/90 mb-2`}>
                      {update.type}
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">{update.title}</h3>
                    <p className="text-blue-100/70">{update.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
