import React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
}
export function PageLayout({
  children,
  className
}: PageLayoutProps) {
  return <div className="flex h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <DashboardSidebar />
      <main className="flex-1 p-8 overflow-y-auto bg-zinc-50">
        <div className={cn("max-w-7xl mx-auto space-y-8", className)}>
          {children}
        </div>
      </main>
    </div>;
}