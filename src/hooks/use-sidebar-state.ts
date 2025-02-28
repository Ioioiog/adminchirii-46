
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUserRole } from "./use-user-role";
import { serviceProviderMenuItems, standardMenuItems } from "@/components/dashboard/sidebar/menuConfigs";

export const useSidebarState = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const { userRole } = useUserRole();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (href: string) => {
    console.log(`Checking if ${href} is active for current path: ${location.pathname}`);
    
    if (href === "/dashboard") {
      return location.pathname === "/" || location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(href);
  };

  const menuItems = userRole === "service_provider" ? serviceProviderMenuItems : standardMenuItems;
  const filteredMenuItems = menuItems.filter(
    (item) => !userRole || item.roles.includes(userRole)
  );

  useEffect(() => {
    console.log("Current user role:", userRole);
    console.log("Current location:", location.pathname);
    console.log("Filtered menu items:", filteredMenuItems.map(item => item.title));
  }, [userRole, location.pathname, filteredMenuItems]);

  return {
    isExpanded,
    setIsExpanded,
    filteredMenuItems,
    isActive,
    navigate
  };
};
