
import { BookOpen, HelpCircle, Building2, Users, Key, MessageSquare } from "lucide-react";
import { useAuthState } from "@/hooks/useAuthState";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export default function InfoPage() {
  const { isLoading, isAuthenticated } = useAuthState();
  const navigate = useNavigate();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 20,
        y: (e.clientY / window.innerHeight) * 20
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="text-lg text-gray-800">Loading...</div>
      </div>
    );
  }

  const buildingConfigs = [
    { height: 400, width: 80, color: 'from-blue-50 to-indigo-50', windows: 20 },
    { height: 300, width: 70, color: 'from-purple-50 to-pink-50', windows: 15 },
    { height: 500, width: 90, color: 'from-indigo-50 to-blue-50', windows: 25 },
    { height: 350, width: 75, color: 'from-sky-50 to-blue-50', windows: 18 },
    { height: 450, width: 85, color: 'from-blue-50 to-indigo-50', windows: 22 },
    { height: 280, width: 65, color: 'from-violet-50 to-purple-50', windows: 14 },
    { height: 420, width: 78, color: 'from-purple-50 to-indigo-50', windows: 21 },
    { height: 380, width: 72, color: 'from-blue-50 to-sky-50', windows: 19 }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-blue-50 relative overflow-hidden perspective-1000">
      {/* Animated 3D Buildings */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute inset-0 transition-transform duration-300 ease-out"
          style={{
            transform: `translate3d(${mousePosition.x}px, ${mousePosition.y}px, 0) rotateX(${mousePosition.y / 50}deg) rotateY(${mousePosition.x / 50}deg)`
          }}
        >
          {buildingConfigs.map((building, i) => (
            <div 
              key={i}
              className={`absolute bottom-0 bg-gradient-to-t ${building.color} rounded-t-lg transform transition-all duration-500 ease-out`}
              style={{
                height: `${building.height}px`,
                width: `${building.width}px`,
                left: `${(i * 12) + 2}%`,
                transform: `translateZ(${i * 10}px) skewX(-12deg) scale(${1 + mousePosition.y / 1000})`,
                boxShadow: `
                  0 0 40px ${i % 2 ? 'rgba(59, 130, 246, 0.05)' : 'rgba(139, 92, 246, 0.05)'},
                  inset 0 0 20px ${i % 2 ? 'rgba(59, 130, 246, 0.025)' : 'rgba(139, 92, 246, 0.025)'}
                `
              }}
            >
              {/* Windows */}
              <div className="absolute inset-x-2 top-2 bottom-0 grid grid-cols-4 gap-2 p-2">
                {Array.from({ length: building.windows }).map((_, j) => (
                  <div 
                    key={j} 
                    className={`bg-white/40 rounded-sm transition-all duration-1000 ${
                      Math.random() > 0.5 ? 'animate-pulse' : ''
                    }`}
                    style={{
                      opacity: Math.random() > 0.3 ? 0.8 : 0.2,
                      boxShadow: `0 0 10px ${Math.random() > 0.7 ? 'rgba(255, 255, 255, 0.3)' : 'transparent'}`
                    }}
                  />
                ))}
              </div>
              
              {/* Light Beam Effect */}
              <div 
                className="absolute top-0 left-1/2 w-20 h-60 bg-gradient-to-b from-blue-100/10 to-transparent -translate-x-1/2 transform-gpu"
                style={{
                  filter: 'blur(20px)',
                  animation: `pulse ${3 + i}s infinite`
                }}
              />
              
              {/* Holographic Scan Line */}
              <div 
                className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-blue-200/20 to-transparent"
                style={{
                  animation: `scanline ${2 + i}s infinite linear`,
                  top: `${(mousePosition.y / 20)}%`
                }}
              />
            </div>
          ))}
          
          {/* Atmospheric Layer */}
          <div className="absolute inset-0 bg-gradient-to-t from-white/60 via-white/30 to-transparent backdrop-blur-[2px]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(59,130,246,0.05),transparent)]" />
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative">
        <div className="container mx-auto px-6 pt-32 pb-20">
          <div className="flex flex-col items-center text-center space-y-8">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-200 to-indigo-200 rounded-full blur opacity-40 group-hover:opacity-75 transition duration-1000"></div>
              <div className="relative p-6 bg-white/80 rounded-full backdrop-blur-xl border border-gray-100 shadow-xl">
                <img 
                  src="/lovable-uploads/9c23bc1b-4e8c-433e-a961-df606dc6a2c6.png" 
                  alt="AdminChirii.ro Logo" 
                  className="w-16 h-16 transform group-hover:scale-110 transition-transform duration-300"
                />
              </div>
            </div>
            <h1 className="text-6xl font-bold text-gray-800 tracking-tight">
              Welcome to the Future of<br />Property Management
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl">
              Experience a revolutionary platform that brings together landlords, tenants, and service providers 
              in one seamless, intelligent ecosystem.
            </p>
            {!isAuthenticated && (
              <Button 
                onClick={() => navigate('/auth')}
                className="relative group px-8 py-6 text-lg bg-white hover:bg-gray-50 text-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 opacity-0 group-hover:opacity-100 blur transition-opacity duration-300" />
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
              gradient: "from-blue-50 to-indigo-50"
            },
            {
              title: "Seamless Communication",
              description: "Connect instantly with tenants and service providers through our secure messaging platform.",
              icon: MessageSquare,
              gradient: "from-purple-50 to-pink-50"
            },
            {
              title: "Secure Access Control",
              description: "Manage digital keys and access permissions with our advanced security system.",
              icon: Key,
              gradient: "from-emerald-50 to-teal-50"
            }
          ].map((feature, index) => (
            <div 
              key={index}
              className="group relative"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-100/20 to-indigo-100/20 rounded-2xl blur opacity-50 group-hover:opacity-100 transition duration-500" />
              <div className="relative h-full p-8 bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-100 shadow-lg transition-transform duration-300 group-hover:-translate-y-2">
                <div className={`inline-flex p-4 rounded-xl bg-gradient-to-r ${feature.gradient} mb-6`}>
                  <feature.icon className="w-8 h-8 text-gray-700" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Updates Section */}
      <div className="relative z-10 container mx-auto px-6 pb-20">
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-100/20 to-indigo-100/20 rounded-2xl blur opacity-50" />
          <div className="relative p-8 bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-100 shadow-lg">
            <h2 className="text-3xl font-bold text-gray-800 mb-8">Latest Updates</h2>
            <div className="space-y-6">
              {[
                {
                  type: "New Feature",
                  title: "AI-Powered Property Insights",
                  description: "Get intelligent recommendations and market analysis for your properties.",
                  gradient: "from-blue-50 to-indigo-50"
                },
                {
                  type: "Enhancement",
                  title: "Smart Contract Integration",
                  description: "Automated contract generation and digital signing capabilities added.",
                  gradient: "from-purple-50 to-pink-50"
                }
              ].map((update, index) => (
                <div 
                  key={index}
                  className="relative group"
                >
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-xl blur opacity-30 group-hover:opacity-50 transition duration-300" />
                  <div className="relative p-6 bg-white/90 backdrop-blur-xl rounded-xl border border-gray-100 shadow-md group-hover:shadow-lg transition-all duration-300">
                    <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r ${update.gradient} text-gray-700 mb-2`}>
                      {update.type}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">{update.title}</h3>
                    <p className="text-gray-600">{update.description}</p>
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
