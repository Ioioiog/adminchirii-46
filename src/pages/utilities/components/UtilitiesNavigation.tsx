
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Gauge, Plug, Building2 } from "lucide-react";

type UtilitiesSection = 'bills' | 'readings' | 'providers';

interface UtilitiesNavigationProps {
  activeSection: UtilitiesSection;
  setActiveSection: (section: UtilitiesSection) => void;
  userRole: string;
}

export function UtilitiesNavigation({ 
  activeSection, 
  setActiveSection,
  userRole
}: UtilitiesNavigationProps) {
  const navigationItems = [
    {
      id: 'bills' as UtilitiesSection,
      label: 'Utility Bills',
      icon: Plug
    },
    {
      id: 'readings' as UtilitiesSection,
      label: 'Meter Readings',
      icon: Gauge
    },
    ...(userRole === 'landlord' ? [{
      id: 'providers' as UtilitiesSection,
      label: 'Utility Providers',
      icon: Building2,
      hideForRole: 'tenant'
    }] : [])
  ];

  return (
    <div className="w-full flex gap-4 overflow-x-auto">
      {navigationItems.map(item => (
        <Button
          key={item.id}
          variant={activeSection === item.id ? 'default' : 'ghost'}
          className={cn("flex-shrink-0 gap-2", activeSection === item.id && "bg-blue-600 text-white hover:bg-blue-700")}
          onClick={() => setActiveSection(item.id)}
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </Button>
      ))}
    </div>
  );
}
