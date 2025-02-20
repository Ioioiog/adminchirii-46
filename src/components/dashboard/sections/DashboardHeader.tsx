
import { useTranslation } from "react-i18next";

interface DashboardHeaderProps {
  userName: string;
}

export function DashboardHeader({ userName }: DashboardHeaderProps) {
  const { t } = useTranslation('dashboard');
  
  return (
    <div className="space-y-2">
      <p className="text-muted-foreground">
        {t('welcome')} <span className="font-medium text-primary">{userName}</span>! {t('overview')}
      </p>
    </div>
  );
}
