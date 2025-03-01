import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useUserRole } from "./use-user-role";
import { serviceProviderMenuItems, standardMenuItems } from "@/components/dashboard/sidebar/menuConfigs";

export const useSidebarState = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const { userRole } = useUserRole();
  const location = useLocation();

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  const menuItems = userRole === "service_provider" ? serviceProviderMenuItems : standardMenuItems;
  const filteredMenuItems = menuItems.filter(
    (item) => !userRole || item.roles.includes(userRole)
  );

  return {
    isExpanded,
    setIsExpanded,
    filteredMenuItems,
    isActive,
  };
};