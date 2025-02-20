
import { useTranslation } from "react-i18next";

interface DashboardHeaderProps {
  userName: string;
}

export function DashboardHeader({ userName }: DashboardHeaderProps) {
  const { t } = useTranslation('dashboard');
  
  return (
    <div className="space-y-1">
      <p className="text-muted-foreground text-lg font-medium animate-fade-in bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 backdrop-blur-sm border border-gray-100/80 rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 p-3">
        {t('welcome')} <span className="font-semibold text-primary hover:text-primary-600 transition-colors">{userName}</span>! {t('overview')}
      </p>
    </div>
  );
}
