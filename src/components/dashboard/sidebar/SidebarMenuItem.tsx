
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { LucideIcon, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Notification, NotificationType } from "@/types/notifications";

interface SidebarMenuItemProps {
  item: {
    title: string;
    icon: LucideIcon;
    href: string;
    notificationType?: NotificationType;
  };
  isActive: boolean;
  isExpanded: boolean;
  notifications?: Notification[];
  onNotificationClick?: (type: NotificationType) => void;
  notificationCount?: number;
}

export const SidebarMenuItem: React.FC<SidebarMenuItemProps> = ({
  item,
  isActive,
  isExpanded,
  notifications = [],
  onNotificationClick,
  notificationCount = 0,
}) => {
  const Icon = item.icon;
  const navigate = useNavigate();
  
  console.log(`Rendering menu item ${item.title} with notification count:`, notificationCount);

  const handleClick = (e: React.MouseEvent) => {
    console.log(`Clicked on menu item: ${item.title}, href: ${item.href}`);
    
    if (item.notificationType && notificationCount > 0 && onNotificationClick) {
      console.log(`Handling notification click for ${item.title} with ${notificationCount} notifications`);
      e.preventDefault();
      onNotificationClick(item.notificationType);
      // After handling notifications, navigate to the page
      navigate(item.href);
    }
    // Regular navigation happens via Link component
  };

  const linkContent = (
    <div
      className={cn(
        "flex items-center px-4 py-2 text-sm font-medium rounded-md transition-all duration-200",
        isActive
          ? "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
          : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-300",
        !isExpanded && "justify-center px-2"
      )}
    >
      <div className="relative">
        <Icon className={cn("h-5 w-5", isActive && "text-blue-600 dark:text-blue-400")} />
        {notificationCount > 0 && (
          <div className="absolute -top-2 -right-2">
            <div className="flex items-center justify-center h-5 w-5 rounded-full bg-red-500">
              <span className="text-[11px] font-medium text-white">
                {notificationCount}
              </span>
            </div>
            <Bell className="absolute -top-1 -right-1 h-3 w-3 text-red-500 animate-pulse" />
          </div>
        )}
      </div>
      {isExpanded && <span className="ml-3">{item.title}</span>}
    </div>
  );

  if (isExpanded) {
    return <Link to={item.href} onClick={handleClick}>{linkContent}</Link>;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link to={item.href} onClick={handleClick}>{linkContent}</Link>
        </TooltipTrigger>
        <TooltipContent side="right" align="center" className="bg-white dark:bg-gray-900 text-sm">
          <div className="flex items-center gap-2">
            {item.title}
            {notificationCount > 0 && (
              <div className="flex items-center justify-center h-5 w-5 rounded-full bg-red-500">
                <span className="text-[11px] font-medium text-white">
                  {notificationCount}
                </span>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
