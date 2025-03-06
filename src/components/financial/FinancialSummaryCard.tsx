
import React from "react";
import { LucideIcon } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

interface FinancialSummaryCardProps {
  title: string;
  amount: string;
  description: string;
  icon: LucideIcon;
  color?: "default" | "green" | "yellow" | "red";
}

const FinancialSummaryCard = ({
  title,
  amount,
  description,
  icon: Icon,
  color = "default"
}: FinancialSummaryCardProps) => {
  const getColorClasses = (color: string) => {
    switch (color) {
      case "green":
        return "text-green-600";
      case "yellow":
        return "text-yellow-600";
      case "red":
        return "text-red-600";
      default:
        return "text-muted-foreground";
    }
  };

  const iconColorClass = getColorClasses(color);
  const amountColorClass = color === "default" ? "" : getColorClasses(color);

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <h3 className="text-sm font-medium">{title}</h3>
        <Icon className={`h-4 w-4 ${iconColorClass}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${amountColorClass}`}>
          {amount}
        </div>
        <p className="text-xs text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  );
};

export default FinancialSummaryCard;
