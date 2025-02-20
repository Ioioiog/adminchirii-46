
import React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ContentCardProps {
  children: React.ReactNode;
  className?: string;
}

export function ContentCard({ children, className }: ContentCardProps) {
  return (
    <Card className={cn("p-6 bg-white/80 backdrop-blur-sm border shadow-sm", className)}>
      {children}
    </Card>
  );
}
