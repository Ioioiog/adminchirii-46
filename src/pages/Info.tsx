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
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  const buildingConfigs = [
    { height: 400, width: 80, color: 'from-blue-500/30 to-purple-500/30', windows: 20 },
    { height: 300, width: 70, color: 'from-purple-500/30 to-pink-500/30', windows: 15 },
    { height: 500, width: 90, color: 'from-indigo-500/30 to-blue-500/30', windows: 25 },
    { height: 350, width: 75, color: 'from-cyan-500/30 to-blue-500/30', windows: 18 },
    { height: 450, width: 85, color: 'from-blue-500/30 to-indigo-500/30', windows: 22 },
    { height: 280, width: 65, color: 'from-violet-500/30 to-purple-500/30', windows: 14 },
    { height: 420, width: 78, color: 'from-purple-500/30 to-indigo-500/30', windows: 21 },
    { height: 380, width: 72, color: 'from-blue-500/30 to-cyan-500/30', windows: 19 }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 relative overflow-hidden perspective-1000">
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
                  0 0 40px ${i % 2 ? 'rgba(59, 130, 246, 0.2)' : 'rgba(139, 92, 246, 0.2)'},
                  inset 0 0 20px ${i % 2 ? 'rgba(59, 130, 246, 0.1)' : 'rgba(139, 92, 246, 0.1)'}
                `
              }}
            >
              {/* Windows */}
              <div className="absolute inset-x-2 top-2 bottom-0 grid grid-cols-4 gap-2 p-2">
                {Array.from({ length: building.windows }).map((_, j) => (
                  <div 
                    key={j} 
                    className={`bg-white/20 rounded-sm transition-all duration-1000 ${
                      Math.random() > 0.5 ? 'animate-pulse' : ''
                    }`}
                    style={{
                      opacity: Math.random() > 0.3 ? 0.8 : 0.2,
                      boxShadow: `0 0 10px ${Math.random() > 0.7 ? 'rgba(255, 255, 255, 0.5)' : 'transparent'}`
                    }}
                  />
                ))}
              </div>
              
              {/* Light Beam Effect */}
              <div 
                className="absolute top-0 left-1/2 w-20 h-60 bg-gradient-to-b from-blue-500/20 to-transparent -translate-x-1/2 transform-gpu"
                style={{
                  filter: 'blur(20px)',
                  animation: `pulse ${3 + i}s infinite`
                }}
              />
              
              {/* Holographic Scan Line */}
              <div 
                className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-blue-400/30 to-transparent"
                style={{
                  animation: `scanline ${2 + i}s infinite linear`,
                  top: `${(mousePosition.y / 20)}%`
                }}
              />
            </div>
          ))}
          
          {/* Atmospheric Fog */}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/50 to-transparent backdrop-blur-sm">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(59,130,246,0.1),transparent)]" />
          </div>
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
