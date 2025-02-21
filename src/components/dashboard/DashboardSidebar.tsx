
import { useState } from "react";
import { SidebarLogo } from "./sidebar/SidebarLogo";
import { SidebarMenu } from "./sidebar/SidebarMenu";
import { SignOutButton } from "./sidebar/SignOutButton";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DashboardSidebar() {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <aside
      className={`${
        isExpanded ? "w-64" : "w-20"
      } glass flex flex-col p-4 transition-all duration-300 relative`}
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-4 top-8 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <ChevronLeft className={`h-4 w-4 transition-transform ${isExpanded ? "" : "rotate-180"}`} />
      </Button>

      <div className="space-y-6 flex-1">
        <SidebarLogo isExpanded={isExpanded} />
        <SidebarMenu isExpanded={isExpanded} />
      </div>

      <SignOutButton isExpanded={isExpanded} />
    </aside>
  );
}
