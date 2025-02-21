import React from "react";
import { Link } from "react-router-dom";
import { LucideIcon, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Notification } from "@/hooks/use-sidebar-notifications";

interface SidebarMenuItemProps {
  item: {
    title: string;
    icon: LucideIcon;
    href: string;
    notificationType?: string;
  };
  isActive: boolean;
  isExpanded: boolean;
  notifications?: Notification[];
  onNotificationClick?: (type: string) => void;
}

export const SidebarMenuItem: React.FC<SidebarMenuItemProps> = ({
  item,
  isActive,
  isExpanded,
  notifications = [],
  onNotificationClick,
}) => {
  const Icon = item.icon;
  
  const notificationCount = React.useMemo(() => {
    if (!item.notificationType || !notifications.length) return 0;
    const notification = notifications.find(n => n.type === item.notificationType);
    console.log(`Notification for ${item.title}:`, notification);
    return notification?.count || 0;
  }, [item.notificationType, notifications, item.title]);

  const handleClick = (e: React.MouseEvent) => {
    if (item.notificationType && notificationCount > 0 && onNotificationClick) {
      console.log(`Handling click for ${item.title} with ${notificationCount} notifications`);
      e.preventDefault();
      onNotificationClick(item.notificationType);
    }
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