
import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { useUserRole } from "@/hooks/use-user-role";

interface NavigationTab {
  id: string;
  label: string;
  icon: LucideIcon;
  showForTenant?: boolean;
  hideForRole?: string;
}

interface NavigationTabsProps {
  tabs: NavigationTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function NavigationTabs({ tabs, activeTab, onTabChange }: NavigationTabsProps) {
  const { userRole } = useUserRole();
  const isTenant = userRole === 'tenant';

  // Filter tabs based on both tenant status and roles to hide
  const visibleTabs = tabs.filter(tab => {
    // Hide if user is tenant and tab shouldn't show for tenants
    if (isTenant && tab.showForTenant === false) {
      return false;
    }
    
    // Hide if tab specifies it should be hidden for current role
    if (tab.hideForRole && tab.hideForRole === userRole) {
      return false;
    }
    
    return true;
  });

  return (
    <Card className="p-4 bg-white/80 backdrop-blur-sm border shadow-sm">
      <div className="flex gap-4 overflow-x-auto">
        {visibleTabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'default' : 'ghost'}
            className={cn(
              "flex-shrink-0 gap-2 transition-all duration-200",
              activeTab === tab.id && "bg-primary text-primary-foreground shadow-sm"
            )}
            onClick={() => onTabChange(tab.id)}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </Button>
        ))}
      </div>
    </Card>
  );
}
