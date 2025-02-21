import {
  LayoutDashboard,
  Home,
  Users,
  Wrench,
  FileText,
  CreditCard,
  Settings,
  Droplets,
  MessageCircle,
  Clipboard,
  UserCog,
  Building2,
  Wallet,
} from "lucide-react";
import { NotificationType } from "@/types/notifications";

export const serviceProviderMenuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
    roles: ["service_provider"],
    notificationType: "maintenance" as NotificationType
  },
  {
    title: "Profile",
    icon: UserCog,
    href: "/service-provider-profile",
    roles: ["service_provider"],
  },
  {
    title: "Job Requests",
    icon: Clipboard,
    href: "/maintenance",
    roles: ["service_provider"],
    notificationType: "maintenance" as NotificationType
  },
  {
    title: "Earnings",
    icon: Wallet,
    href: "/earnings",
    roles: ["service_provider"],
    notificationType: "payments" as NotificationType
  },
  {
    title: "Settings",
    icon: Settings,
    href: "/settings",
    roles: ["service_provider"],
  },
];

export const standardMenuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
    roles: ["landlord", "tenant"],
  },
  {
    title: "Properties",
    icon: Home,
    href: "/properties",
    roles: ["landlord", "tenant"],
  },
  {
    title: "Tenants",
    icon: Users,
    href: "/tenants",
    roles: ["landlord"],
  },
  {
    title: "Maintenance",
    icon: Wrench,
    href: "/maintenance",
    roles: ["landlord", "tenant"],
    notificationType: "maintenance" as NotificationType
  },
  {
    title: "Documents",
    icon: FileText,
    href: "/documents",
    roles: ["landlord", "tenant"],
  },
  {
    title: "Financial",
    icon: Wallet,
    href: "/financial",
    roles: ["landlord", "tenant"],
    notificationType: "payments" as NotificationType
  },
  {
    title: "Utilities",
    icon: Droplets,
    href: "/utilities",
    roles: ["landlord", "tenant"],
  },
  {
    title: "Chat",
    icon: MessageCircle,
    href: "/chat",
    roles: ["landlord", "tenant"],
    notificationType: "messages" as NotificationType
  },
  {
    title: "Settings",
    icon: Settings,
    href: "/settings",
    roles: ["landlord", "tenant"],
  },
];
