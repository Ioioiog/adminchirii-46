
import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useSidebarNotifications } from "@/hooks/use-sidebar-notifications";
import { SidebarLogo } from "./sidebar/SidebarLogo";
import { SidebarMenuItem } from "./sidebar/SidebarMenuItem";
import { SignOutButton } from "./sidebar/SignOutButton";
import { useSidebarState } from "@/hooks/use-sidebar-state";
import { useNavigate } from "react-router-dom";

export const DashboardSidebar = () => {
  const { isExpanded, setIsExpanded, filteredMenuItems, isActive } = useSidebarState();
  const { data: notifications, markAsRead } = useSidebarNotifications();
  const navigate = useNavigate();

  const handleNotificationClick = (type: string) => {
    console.log(`Marking ${type} notifications as read`);
    markAsRead(type);
  };

  const handleDashboardClick = () => {
    console.log("Navigating to dashboard");
    navigate("/dashboard");
  };

  return (
    <Collapsible
      defaultOpen={true}
      open={isExpanded}
      onOpenChange={setIsExpanded}
      className={cn(
        "relative h-screen glass border-r border-glass-border flex flex-col transition-all duration-300",
        isExpanded ? "w-64" : "w-16"
      )}
    >
      <div className="p-4 border-b border-glass-border">
        <SidebarLogo isExpanded={isExpanded} />
      </div>
      
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-3 top-6 h-7 w-7 rounded-full glass-button"
        >
          {isExpanded ? (
            <ChevronLeft className="h-4 w-4 text-white" />
          ) : (
            <ChevronRight className="h-4 w-4 text-white" />
          )}
          <span className="sr-only">Toggle sidebar</span>
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent
        forceMount
        className="flex-1 overflow-y-auto py-4 px-3"
      >
        <nav className="space-y-1.5">
          {filteredMenuItems.map((item) => (
            <SidebarMenuItem
              key={item.href}
              item={item}
              isActive={isActive(item.href)}
              isExpanded={isExpanded}
              notifications={notifications}
              onNotificationClick={handleNotificationClick}
            />
          ))}
        </nav>
      </CollapsibleContent>

      <div className="p-4 border-t border-glass-border">
        <SignOutButton isExpanded={isExpanded} />
      </div>
    </Collapsible>
  );
}
