
import { useState } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Book, Users, Building2, Wrench, Bot } from "lucide-react";
import { NavigationTabs } from "@/components/layout/NavigationTabs";
import { TenantGuide } from "@/components/learn/TenantGuide";
import { LandlordGuide } from "@/components/learn/LandlordGuide";
import { ServiceProviderGuide } from "@/components/learn/ServiceProviderGuide";
import { AiGuide } from "@/components/learn/AiGuide";
import { useUserRole } from "@/hooks/use-user-role";
import { useTranslation } from "react-i18next";

export default function Learn() {
  const { userRole } = useUserRole();
  const { t } = useTranslation('learn');
  
  const [activeTab, setActiveTab] = useState(() => {
    // Set default tab based on user role
    if (userRole === "tenant") return "tenant";
    if (userRole === "service_provider") return "service-provider";
    return "landlord"; // Default to landlord if role is landlord or unknown
  });

  const tabs = [
    {
      id: "tenant",
      label: t('tabs.tenant'),
      icon: Users,
    },
    {
      id: "landlord",
      label: t('tabs.landlord'),
      icon: Building2,
    },
    {
      id: "service-provider",
      label: t('tabs.serviceProvider'),
      icon: Wrench,
    },
    {
      id: "ai-assistant",
      label: t('tabs.aiAssistant'),
      icon: Bot,
    }
  ];

  return (
    <PageLayout>
      <PageHeader
        icon={Book}
        title={t('pageTitle')}
        description={t('pageDescription')}
      />

      <div className="space-y-6">
        <NavigationTabs 
          tabs={tabs} 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
        />

        <div className="p-6 bg-white rounded-lg shadow-sm">
          {activeTab === "tenant" && <TenantGuide />}
          {activeTab === "landlord" && <LandlordGuide />}
          {activeTab === "service-provider" && <ServiceProviderGuide />}
          {activeTab === "ai-assistant" && <AiGuide />}
        </div>
      </div>
    </PageLayout>
  );
}
