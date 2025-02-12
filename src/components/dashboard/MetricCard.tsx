
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  className?: string;
  route?: string;
  onClick?: () => void;
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  description,
  className,
  route,
  onClick,
}: MetricCardProps) {
  const { t } = useTranslation('dashboard'); // Specify 'dashboard' namespace
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  if (!Icon) {
    console.error("Icon is undefined for metric card:", title);
    return null;
  }

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (route) {
      navigate(route);
    }
  };

  const shouldAnimate = title === 'metrics.totalProperties' || 
                       title === 'metrics.activeTenants' || 
                       title === 'metrics.pendingMaintenance' ||
                       title === 'metrics.monthlyRevenue' ||
                       title === 'metrics.paymentStatus';

  return (
    <Card 
      className={cn(
        "overflow-hidden relative", 
        className,
        (route || onClick) && "cursor-pointer hover:scale-105 transform transition-all duration-300"
      )}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {shouldAnimate && isHovered ? (
        <div className="absolute inset-0 flex items-center justify-center bg-white transition-all duration-500">
          <Icon 
            className={cn(
              "h-20 w-20 text-white p-4 rounded-full transition-all duration-500 bg-blue-600",
              isHovered && "scale-110"
            )}
          />
        </div>
      ) : (
        <>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t(title)}
            </CardTitle>
            <div className="flex items-center justify-center w-8 h-8">
              <Icon className="h-6 w-6 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{value || '0'}</div>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">
                {t(description)}
              </p>
            )}
          </CardContent>
        </>
      )}
    </Card>
  );
}
