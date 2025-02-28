
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
import { NotificationType } from "@/types/notifications";
import { SidebarLogo } from "./sidebar/SidebarLogo";
import { SidebarMenuItem } from "./sidebar/SidebarMenuItem";
import { SignOutButton } from "./sidebar/SignOutButton";
import { useSidebarState } from "@/hooks/use-sidebar-state";
import { useNavigate } from "react-router-dom";

export const DashboardSidebar = () => {
  const { isExpanded, setIsExpanded, filteredMenuItems, isActive } = useSidebarState();
  const { data: notifications, markAsRead } = useSidebarNotifications();
  const navigate = useNavigate();

  const handleNotificationClick = (type: NotificationType) => {
    console.log(`Marking ${type} notifications as read`);
    markAsRead(type);
  };

  return (
    <Collapsible
      defaultOpen={true}
      open={isExpanded}
      onOpenChange={setIsExpanded}
      className={cn(
        "relative h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col transition-all duration-300 shadow-sm",
        isExpanded ? "w-64" : "w-16"
      )}
    >
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <SidebarLogo isExpanded={isExpanded} />
      </div>
      
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-3 top-6 h-7 w-7 rounded-full border bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-lg hover:shadow-md hover:bg-white/90 transition-all duration-200 dark:bg-gray-950/80 dark:hover:bg-gray-950/90 dark:border-gray-800"
        >
          {isExpanded ? (
            <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          )}
          <span className="sr-only">Toggle sidebar</span>
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent
        forceMount
        className="flex-1 overflow-y-auto py-4 px-3"
      >
        <nav className="space-y-1.5">
          {filteredMenuItems.map((item) => {
            // Get notification count for this menu item if it has a notification type
            const notificationCount = item.notificationType
              ? notifications?.find(n => n.type === item.notificationType)?.count || 0
              : 0;
              
            console.log(`Menu item ${item.title}, href: ${item.href}, active: ${isActive(item.href)}`);
            
            return (
              <SidebarMenuItem
                key={item.href}
                item={item}
                isActive={isActive(item.href)}
                isExpanded={isExpanded}
                notifications={notifications}
                onNotificationClick={handleNotificationClick}
                notificationCount={notificationCount}
              />
            );
          })}
        </nav>
      </CollapsibleContent>

      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <SignOutButton isExpanded={isExpanded} />
      </div>
    </Collapsible>
  );
};
