
import { useState } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Book, Users, Building2, Wrench } from "lucide-react";
import { NavigationTabs } from "@/components/layout/NavigationTabs";
import { TenantGuide } from "@/components/learn/TenantGuide";
import { LandlordGuide } from "@/components/learn/LandlordGuide";
import { ServiceProviderGuide } from "@/components/learn/ServiceProviderGuide";
import { useUserRole } from "@/hooks/use-user-role";

export default function Learn() {
  const { userRole } = useUserRole();
  const [activeTab, setActiveTab] = useState(() => {
    // Set default tab based on user role
    if (userRole === "tenant") return "tenant";
    if (userRole === "service_provider") return "service-provider";
    return "landlord"; // Default to landlord if role is landlord or unknown
  });

  const tabs = [
    {
      id: "tenant",
      label: "Tenant Guide",
      icon: Users,
    },
    {
      id: "landlord",
      label: "Landlord Guide",
      icon: Building2,
    },
    {
      id: "service-provider",
      label: "Service Provider Guide",
      icon: Wrench,
    }
  ];

  return (
    <PageLayout>
      <PageHeader
        icon={Book}
        title="Platform Guide"
        description="Learn how to use the platform based on your role"
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
        </div>
      </div>
    </PageLayout>
  );
}
