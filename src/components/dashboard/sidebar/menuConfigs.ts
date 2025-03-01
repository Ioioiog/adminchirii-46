
import { 
  Home, 
  Building2, 
  Users, 
  FileText, 
  Settings, 
  CreditCard, 
  Droplets, 
  MessageSquare,
  Wrench,
  MapPin,
  Briefcase,
  CircleDollarSign
} from "lucide-react";

export const standardMenuItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: Home,
    roles: ["landlord", "tenant", "service_provider"],
  },
  {
    name: "Properties",
    href: "/properties",
    icon: Building2,
    roles: ["landlord", "tenant"],
  },
  {
    name: "Tenants",
    href: "/tenants",
    icon: Users,
    roles: ["landlord"],
  },
  {
    name: "Documents",
    href: "/documents",
    icon: FileText,
    roles: ["landlord", "tenant"],
  },
  {
    name: "Financial",
    href: "/financial",
    icon: CreditCard,
    roles: ["landlord", "tenant"],
  },
  {
    name: "Utilities",
    href: "/utilities",
    icon: Droplets,
    roles: ["landlord", "tenant"],
  },
  {
    name: "Chat",
    href: "/chat",
    icon: MessageSquare,
    roles: ["landlord", "tenant", "service_provider"],
  },
  {
    name: "Maintenance",
    href: "/maintenance",
    icon: Wrench,
    roles: ["landlord", "tenant", "service_provider"],
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
    roles: ["landlord", "tenant", "service_provider"],
  },
];

export const serviceProviderMenuItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: Home,
    roles: ["service_provider"],
  },
  {
    name: "Profile",
    href: "/service-provider-profile",
    icon: Users,
    roles: ["service_provider"],
  },
  {
    name: "Service Areas",
    href: "/service-areas",
    icon: MapPin,
    roles: ["service_provider"],
  },
  {
    name: "Services",
    href: "/services",
    icon: Briefcase,
    roles: ["service_provider"],
  },
  {
    name: "Earnings",
    href: "/earnings",
    icon: CircleDollarSign,
    roles: ["service_provider"],
  },
  {
    name: "Maintenance",
    href: "/maintenance",
    icon: Wrench,
    roles: ["service_provider"],
  },
  {
    name: "Chat",
    href: "/chat",
    icon: MessageSquare,
    roles: ["service_provider"],
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
    roles: ["service_provider"],
  },
];
