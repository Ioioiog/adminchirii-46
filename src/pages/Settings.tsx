
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AccountSettings } from "@/components/settings/sections/AccountSettings";
import { FinancialSettings } from "@/components/settings/sections/FinancialSettings";
import { PreferencesSettings } from "@/components/settings/sections/PreferencesSettings";
import { SubscriptionSettings } from "@/components/settings/sections/SubscriptionSettings";
import { Settings2, Wallet, Languages, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserRole } from "@/hooks/use-user-role";
import { PageLayout } from "@/components/layout/PageLayout";
import { ContentCard } from "@/components/layout/ContentCard";
import { PageHeader } from "@/components/layout/PageHeader";

type SettingsSection = 'account' | 'financial' | 'preferences' | 'subscription';

const Settings = () => {
  const [activeSection, setActiveSection] = useState<SettingsSection>('account');
  const { userRole } = useUserRole();

  const navigationItems = [
    {
      id: 'account' as SettingsSection,
      label: 'Account Settings',
      icon: Settings2,
    },
    {
      id: 'financial' as SettingsSection,
      label: 'Financial & Payments',
      icon: Wallet,
      showForRole: ['landlord', 'tenant', 'service_provider'], // Show for all roles
    },
    {
      id: 'preferences' as SettingsSection,
      label: 'Preferences',
      icon: Languages,
    },
    ...(userRole === 'landlord' ? [{
      id: 'subscription' as SettingsSection,
      label: 'Subscription',
      icon: Crown,
    }] : []),
  ];

  const renderSection = () => {
    switch (activeSection) {
      case 'account':
        return <AccountSettings />;
      case 'financial':
        return <FinancialSettings />;
      case 'preferences':
        return <PreferencesSettings />;
      case 'subscription':
        return userRole === 'landlord' ? <SubscriptionSettings /> : null;
      default:
        return <AccountSettings />;
    }
  };

  // Filter navigation items based on user role
  const visibleItems = navigationItems.filter(item => 
    !item.showForRole || item.showForRole.includes(userRole)
  );

  return (
    <PageLayout>
      <div className="space-y-8">
        <PageHeader
          icon={Settings2}
          title="Settings"
          description="Manage your account settings and preferences"
        />

        <ContentCard className="p-0 overflow-hidden">
          <div className="border-b border-border/20 bg-gradient-to-br from-gray-50 to-white/50">
            <div className="flex gap-2 p-4 overflow-x-auto">
              {visibleItems.map((item) => (
                <Button
                  key={item.id}
                  variant={activeSection === item.id ? 'default' : 'ghost'}
                  className={cn(
                    "flex-shrink-0 gap-2 transition-all duration-200",
                    activeSection === item.id 
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm hover:from-blue-700 hover:to-indigo-700" 
                      : "hover:bg-gray-100"
                  )}
                  onClick={() => setActiveSection(item.id)}
                >
                  <item.icon className={cn(
                    "h-4 w-4",
                    activeSection === item.id ? "text-white" : "text-gray-500"
                  )} />
                  {item.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="p-6 bg-gradient-to-br from-white to-gray-50/50 transition-all duration-300 animate-fade-in">
            {renderSection()}
          </div>
        </ContentCard>
      </div>
    </PageLayout>
  );
};

export default Settings;
