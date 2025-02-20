
import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface NavigationTab {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface NavigationTabsProps {
  tabs: NavigationTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function NavigationTabs({ tabs, activeTab, onTabChange }: NavigationTabsProps) {
  return (
    <Card className="p-4 bg-white/80 backdrop-blur-sm border shadow-sm">
      <div className="flex gap-4 overflow-x-auto">
        {tabs.map((tab) => (
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
