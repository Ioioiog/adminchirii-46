"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Property } from "@/utils/propertyUtils";
import { TenantInviteForm } from "./TenantInviteForm";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface TenantInviteDialogProps {
  properties: Property[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TenantInviteDialog({ properties, open, onOpenChange }: TenantInviteDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (data: any) => {
    console.log("Starting tenant invitation process with data:", data);
    setIsSubmitting(true);
    
    try {
      // Generate a unique token
      const token = crypto.randomUUID();
      console.log("Generated invitation token:", token);

      // Insert the invitation
      const { data: invitation, error: invitationError } = await supabase
        .from('tenant_invitations')
        .insert({
          email: data.email,
          first_name: data.firstName,
          last_name: data.lastName,
          token: token,
          start_date: data.startDate,
          end_date: data.endDate || null,
          status: 'pending',
          expiration_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        })
        .select()
        .single();

      if (invitationError) {
        console.error("Error creating invitation:", invitationError);
        throw new Error(invitationError.message);
      }

      console.log("Created invitation:", invitation);

      // Insert property assignments
      const propertyAssignments = data.propertyIds.map((propertyId: string) => ({
        invitation_id: invitation.id,
        property_id: propertyId,
      }));

      const { error: propertyAssignmentError } = await supabase
        .from('tenant_invitation_properties')
        .insert(propertyAssignments);

      if (propertyAssignmentError) {
        console.error("Error assigning properties:", propertyAssignmentError);
        throw new Error(propertyAssignmentError.message);
      }

      console.log("Created property assignments:", propertyAssignments);

      // Get property details for the email
      const { data: propertyDetails, error: propertyError } = await supabase
        .from('properties')
        .select('name, address')
        .in('id', data.propertyIds);

      if (propertyError) {
        console.error("Error fetching property details:", propertyError);
        throw new Error(propertyError.message);
      }

      console.log("Fetched property details for email:", propertyDetails);

      // Send invitation email
      const { error: emailError } = await supabase.functions.invoke(
        'send-tenant-invitation',
        {
          body: {
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            properties: propertyDetails,
            token: token,
            startDate: data.startDate,
            endDate: data.endDate
          }
        }
      );

      if (emailError) {
        console.error("Error sending invitation email:", emailError);
        throw new Error("Failed to send invitation email");
      }

      console.log("Successfully sent invitation email");

      // Show success message
      toast({
        title: "Success",
        description: "Tenant invitation sent successfully.",
      });

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["tenant-invitations"] });

      // Close the dialog
      onOpenChange(false);
    } catch (error) {
      console.error("Error in tenant invitation process:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create tenant invitation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite New Tenant</DialogTitle>
          <DialogDescription>
            Fill in the details below to invite a new tenant. They will receive an email with instructions to complete their registration.
          </DialogDescription>
        </DialogHeader>
        <TenantInviteForm 
          properties={properties}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
}