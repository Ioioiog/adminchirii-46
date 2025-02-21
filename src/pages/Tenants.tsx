import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { useToast } from "@/hooks/use-toast";
import { TenantList } from "@/components/tenants/TenantList";
import { useTenants } from "@/hooks/useTenants";
import { Property, PropertyStatus } from "@/utils/propertyUtils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TenantsHeader } from "@/components/tenants/TenantsHeader";
import { TenantDashboard } from "@/components/tenants/TenantDashboard";
import { NoTenancy } from "@/components/tenants/NoTenancy";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, UserPlus, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TenantInviteDialog } from "@/components/tenants/TenantInviteDialog";
import { TenantAssignDialog } from "@/components/tenants/TenantAssignDialog";
import { ScrollArea } from "@/components/ui/scroll-area";

const Tenants = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<"landlord" | "tenant" | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const { data: tenants = [], isLoading, error: tenantsError } = useTenants();
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      try {
        console.log("Checking user session...");
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Session error:", sessionError);
          throw sessionError;
        }

        if (!session) {
          console.log("No active session found, redirecting to auth");
          navigate("/auth");
          return;
        }

        setUserId(session.user.id);
        console.log("User ID set:", session.user.id);

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .maybeSingle();

        if (profileError) {
          console.error("Profile fetch error:", profileError);
          throw profileError;
        }

        if (!profile) {
          console.log("No profile found");
          return;
        }

        console.log("Profile role:", profile.role);
        setUserRole(profile.role as "landlord" | "tenant");

        if (profile.role === "tenant") {
          console.log("User is tenant, redirecting to dashboard");
          navigate("/dashboard");
          return;
        }

        setIsCheckingProfile(false);

        if (profile.role === "landlord") {
          console.log("Fetching properties for landlord");
          const { data: propertiesData, error: propertiesError } = await supabase
            .from("properties")
            .select(`
              *,
              tenancies (
                id,
                status,
                tenant_id
              )
            `)
            .eq("landlord_id", session.user.id);

          if (propertiesError) {
            console.error("Properties fetch error:", propertiesError);
            throw propertiesError;
          }

          const transformedProperties: Property[] = (propertiesData || []).map(property => ({
            id: property.id,
            name: property.name,
            address: property.address,
            type: property.type,
            monthly_rent: property.monthly_rent,
            created_at: property.created_at,
            updated_at: property.updated_at,
            description: property.description || '',
            available_from: property.available_from || null,
            status: property.tenancies?.some(t => t.status === 'active') ? 'occupied' : 'vacant',
            tenant_count: property.tenancies?.filter(t => t.status === 'active').length || 0,
            landlord_id: property.landlord_id
          }));

          console.log("Properties fetched:", transformedProperties.length);
          setProperties(transformedProperties);
        }
      } catch (error: any) {
        console.error("Error in checkUser:", error);
        toast({
          title: t('common.error'),
          description: error.message || t('common.unexpectedError'),
          variant: "destructive",
        });
      }
    };

    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast, t]);

  if (isCheckingProfile) {
    return (
      <div className="flex bg-dashboard-background min-h-screen">
        <DashboardSidebar />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <Skeleton className="h-12 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!userId || !userRole) return null;

  if (tenantsError) {
    return (
      <div className="flex bg-dashboard-background min-h-screen">
        <DashboardSidebar />
        <main className="flex-1 p-8">
          <Alert variant="destructive">
            <AlertDescription>
              {t('tenants.error.loading')}
            </AlertDescription>
          </Alert>
        </main>
      </div>
    );
  }

  if (userRole !== "landlord") {
    return null;
  }

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar />
      <ScrollArea className="flex-1">
        <div className="p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="bg-white p-8 rounded-lg shadow-sm mb-6 animate-fade-in">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-4">
                  <div className="p-3 bg-blue-600 rounded-xl">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                    {t('tenants.title')}
                  </h1>
                </div>
                <p className="text-gray-500 max-w-2xl">
                  {t('tenants.description')}
                </p>
              </div>
              {userRole === "landlord" && (
                <div className="flex flex-wrap gap-3 sm:flex-nowrap">
                  <Button
                    onClick={() => setShowAssignDialog(true)}
                    variant="outline"
                    className="w-full sm:w-auto flex items-center gap-2 hover:bg-gray-50 transition-colors"
                  >
                    <UserPlus className="h-4 w-4 text-gray-600" />
                    <span>{t('tenants.addTenant')}</span>
                  </Button>
                  <Button
                    onClick={() => setShowInviteDialog(true)}
                    className="w-full sm:w-auto flex items-center gap-2 bg-blue-600 hover:bg-blue-700 transition-colors"
                  >
                    <Mail className="h-4 w-4" />
                    <span>{t('tenants.inviteTenant')}</span>
                  </Button>
                </div>
              )}
            </div>

            <TenantInviteDialog
              properties={properties}
              open={showInviteDialog}
              onOpenChange={setShowInviteDialog}
            />
            
            <TenantAssignDialog
              properties={properties}
              open={showAssignDialog}
              onOpenChange={setShowAssignDialog}
            />
          </div>
          
          <div className="space-y-6">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
            ) : (
              <TenantList 
                tenants={tenants} 
                isLandlord={userRole === 'landlord'}
              />
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default Tenants;
