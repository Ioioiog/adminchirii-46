
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { useToast } from "@/hooks/use-toast";
import { TenantInviteForm, TenantFormValues } from "@/components/tenants/TenantInviteForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { UserPlus } from "lucide-react";
import { Property } from "@/utils/propertyUtils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const PropertyTenantInvite = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setIsLoading(true);
        
        // Get current user's session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate("/auth");
          return;
        }

        // Fetch the specific property
        const { data: propertyData, error: propertyError } = await supabase
          .from("properties")
          .select("*")
          .eq("id", id)
          .single();

        if (propertyError) {
          throw propertyError;
        }

        // Check if the current user is the landlord of this property
        if (propertyData.landlord_id !== session.user.id) {
          toast({
            title: "Access Denied",
            description: "You don't have permission to invite tenants to this property.",
            variant: "destructive",
          });
          navigate(`/properties/${id}`);
          return;
        }

        // Transform property data to match the Property type
        const transformedProperty: Property = {
          id: propertyData.id,
          name: propertyData.name,
          address: propertyData.address,
          type: propertyData.type,
          monthly_rent: propertyData.monthly_rent,
          currency: propertyData.currency || 'EUR', // Add currency with default value
          status: "vacant", // Default value, might need to be updated
          tenant_count: 0, // Default value, might need to be updated
          created_at: propertyData.created_at,
          updated_at: propertyData.updated_at,
          description: propertyData.description || "",
          available_from: propertyData.available_from,
          landlord_id: propertyData.landlord_id,
        };

        setProperties([transformedProperty]);
      } catch (error: any) {
        console.error("Error fetching property:", error);
        toast({
          title: "Error",
          description: error.message || "An error occurred while fetching the property.",
          variant: "destructive",
        });
        navigate("/properties");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchProperties();
    }
  }, [id, navigate, toast]);

  const handleSubmit = async (data: TenantFormValues) => {
    try {
      setIsSubmitting(true);
      console.log("Form data:", data);

      // Get current user's session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("You must be logged in to invite tenants.");
      }

      // Generate a unique token for the invitation
      const token = crypto.randomUUID();

      // Create the tenant invitation
      const { data: invitation, error: invitationError } = await supabase
        .from("tenant_invitations")
        .insert({
          email: data.email,
          first_name: data.firstName,
          last_name: data.lastName,
          start_date: data.startDate,
          end_date: data.endDate || null,
          status: "pending",
          token: token,
          used: false
        })
        .select("id")
        .single();

      if (invitationError) {
        throw invitationError;
      }

      // Link properties to the invitation
      const propertyMappings = data.propertyIds.map(propertyId => ({
        invitation_id: invitation.id,
        property_id: propertyId,
      }));

      const { error: propertyMappingError } = await supabase
        .from("tenant_invitation_properties")
        .insert(propertyMappings);

      if (propertyMappingError) {
        throw propertyMappingError;
      }

      // Get property details for the email
      const { data: propertyDetails, error: propDetailsError } = await supabase
        .from('properties')
        .select('name, address')
        .in('id', data.propertyIds);
      
      if (propDetailsError) {
        console.error("Error fetching property details:", propDetailsError);
        // Continue anyway, as the invitation is created
      }

      // Call the Edge Function to send the invitation email
      const { data: functionData, error: functionError } = await supabase.functions.invoke("send-tenant-invitation", {
        body: {
          invitationId: invitation.id,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          token: token,
          properties: propertyDetails || [],
        },
      });

      if (functionError) {
        console.error("Error sending invitation email:", functionError);
        // We don't throw here because the invitation was created successfully
        toast({
          title: "Invitation Created",
          description: "Invitation created, but there was an issue sending the email. You may need to contact the tenant directly.",
          variant: "default",
        });
      } else {
        toast({
          title: "Success",
          description: "Tenant invitation sent successfully!",
          variant: "default",
        });
      }

      // Navigate back to the property details page
      navigate(`/properties/${id}`);
    } catch (error: any) {
      console.error("Error creating tenant invitation:", error);
      toast({
        title: "Error",
        description: error.message || "An error occurred while creating the tenant invitation.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex bg-dashboard-background min-h-screen">
      <DashboardSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <PageHeader
            icon={UserPlus}
            title="Invite Tenant"
            description="Send an invitation to a new tenant for this property"
          />

          <Card>
            <CardHeader>
              <CardTitle>Tenant Details</CardTitle>
              <CardDescription>
                Fill in the details below to invite a tenant to {properties[0]?.name || "this property"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center p-8">
                  <div className="w-8 h-8 border-4 border-t-blue-500 border-b-blue-700 rounded-full animate-spin"></div>
                </div>
              ) : (
                <TenantInviteForm
                  properties={properties}
                  onSubmit={handleSubmit}
                  isSubmitting={isSubmitting}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default PropertyTenantInvite;
