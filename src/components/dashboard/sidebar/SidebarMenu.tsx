
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  Building2,
  Users,
  Wallet,
  Wrench,
  FileText,
  MessageSquare,
  BarChart,
  Settings,
  LucideIcon,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MenuItem {
  icon: LucideIcon;
  label: string;
  href: string;
}

interface SidebarMenuProps {
  isExpanded: boolean;
}

export const SidebarMenu: React.FC<SidebarMenuProps> = ({ isExpanded }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems: MenuItem[] = [
    { icon: Home, label: "Dashboard", href: "/dashboard" },
    { icon: Building2, label: "Properties", href: "/properties" },
    { icon: Users, label: "Tenants", href: "/tenants" },
    { icon: Wallet, label: "Payments", href: "/payments" },
    { icon: Wrench, label: "Maintenance", href: "/maintenance" },
    { icon: FileText, label: "Documents", href: "/documents" },
    { icon: MessageSquare, label: "Messages", href: "/chat" },
    { icon: BarChart, label: "Analytics", href: "/analytics" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ];

  const isActive = (href: string) => location.pathname === href;

  const MenuItem = ({ icon: Icon, label, href }: MenuItem) => {
    const active = isActive(href);

    if (isExpanded) {
      return (
        <button
          onClick={() => navigate(href)}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
            active
              ? "bg-blue-500 text-white"
              : "text-gray-300 hover:bg-white/10 hover:text-white"
          }`}
        >
          <Icon className="h-5 w-5" />
          <span>{label}</span>
        </button>
      );
    }

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => navigate(href)}
              className={`w-full flex items-center justify-center p-2 rounded-lg transition-colors ${
                active
                  ? "bg-blue-500 text-white"
                  : "text-gray-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className="h-5 w-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>{label}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <nav className="space-y-2">
      {menuItems.map((item) => (
        <MenuItem key={item.href} {...item} />
      ))}
    </nav>
  );
};
