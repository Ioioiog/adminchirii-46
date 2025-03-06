
import React from "react";
import { LucideIcon, DollarSign, Euro, BadgePoundSterling, CreditCard } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

interface FinancialSummaryCardProps {
  title: string;
  amount: string;
  description: string;
  icon: LucideIcon;
  color?: "default" | "green" | "yellow" | "red";
  currencyCode?: string;
}

const FinancialSummaryCard = ({
  title,
  amount,
  description,
  icon: Icon,
  color = "default",
  currencyCode
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

  const getCurrencyIcon = () => {
    if (!currencyCode) return <Icon className={`h-4 w-4 ${iconColorClass}`} />;
    
    switch (currencyCode) {
      case "USD":
        return <DollarSign className={`h-4 w-4 ${iconColorClass}`} />;
      case "EUR":
        return <Euro className={`h-4 w-4 ${iconColorClass}`} />;
      case "GBP":
        return <BadgePoundSterling className={`h-4 w-4 ${iconColorClass}`} />;
      case "RON":
        return <span className={`text-xs font-bold ${iconColorClass}`}>RON</span>;
      default:
        return <Icon className={`h-4 w-4 ${iconColorClass}`} />;
    }
  };

  const iconColorClass = getColorClasses(color);
  const amountColorClass = color === "default" ? "" : getColorClasses(color);

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <h3 className="text-sm font-medium">{title}</h3>
        {getCurrencyIcon()}
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
