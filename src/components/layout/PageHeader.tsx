
import React from "react";
import { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ icon: Icon, title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-sm">
            <Icon className="h-5 w-5 md:h-6 md:w-6 text-white" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
        </div>
        {description && (
          <p className="text-sm md:text-base text-gray-500">{description}</p>
        )}
      </div>
      {actions && (
        <div>{actions}</div>
      )}
    </div>
  );
}
