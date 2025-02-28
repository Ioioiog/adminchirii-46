
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useConversation(currentUserId: string | null, selectedTenantId: string | null) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!currentUserId) {
      console.log("No current user ID yet");
      setIsLoading(false);
      return;
    }

    if (!selectedTenantId && currentUserId) {
      console.log("No tenant selected for conversation");
      setIsLoading(false);
      return;
    }

    const setupConversation = async () => {
      setIsLoading(true);
      try {
        console.log("Setting up conversation for user:", currentUserId, "with tenant:", selectedTenantId);
        
        const { data: userProfile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', currentUserId)
          .maybeSingle();

        if (profileError) {
          console.error("Error fetching user profile:", profileError);
          throw profileError;
        }

        console.log("User profile:", userProfile);

        // First check if the conversation already exists
        let { data: existingConversations, error: existingError } = await supabase
          .from('conversations')
          .select('id')
          .eq(userProfile?.role === 'tenant' ? 'tenant_id' : 'landlord_id', currentUserId)
          .eq(userProfile?.role === 'tenant' ? 'landlord_id' : 'tenant_id', selectedTenantId);

        if (existingError) {
          console.error("Error checking existing conversations:", existingError);
          throw existingError;
        }

        if (existingConversations && existingConversations.length > 0) {
          // Use the first existing conversation
          console.log("Found existing conversation:", existingConversations[0].id);
          setConversationId(existingConversations[0].id);
        } else if (userProfile?.role === 'landlord') {
          // Create a new conversation for landlord
          console.log("Creating new conversation between landlord and tenant");
          const { data: newConversation, error: createError } = await supabase
            .from('conversations')
            .insert({
              landlord_id: currentUserId,
              tenant_id: selectedTenantId,
            })
            .select('id')
            .single();

          if (createError) {
            console.error("Error creating conversation:", createError);
            throw createError;
          }

          console.log("Created new conversation:", newConversation.id);
          setConversationId(newConversation.id);
        } else {
          console.log("No conversation found and not authorized to create one");
          setConversationId(null);
        }
      } catch (error) {
        console.error("Error setting up conversation:", error);
        toast({
          title: "Error",
          description: "Failed to setup conversation",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    setupConversation();
  }, [currentUserId, selectedTenantId, toast]);

  return { conversationId, isLoading };
}
