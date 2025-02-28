
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
      return;
    }

    const setupConversation = async () => {
      setIsLoading(true);
      try {
        console.log("Setting up conversation for user:", currentUserId);
        
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

        let query = supabase
          .from('conversations')
          .select('id');

        if (userProfile?.role === 'tenant') {
          query = query.eq('tenant_id', currentUserId);
        } else {
          if (!selectedTenantId) {
            console.log("No tenant selected for landlord");
            setIsLoading(false);
            return;
          }
          query = query
            .eq('landlord_id', currentUserId)
            .eq('tenant_id', selectedTenantId);
        }

        // Removed .maybeSingle() to avoid 406 error
        const { data: conversations, error: conversationError } = await query;

        if (conversationError) {
          throw conversationError;
        }

        if (!conversations || conversations.length === 0) {
          if (userProfile?.role === 'landlord' && selectedTenantId) {
            console.log("Creating new conversation between landlord and tenant");
            const { data: newConversation, error: createError } = await supabase
              .from('conversations')
              .insert({
                landlord_id: currentUserId,
                tenant_id: selectedTenantId,
              })
              .select('id')
              .single();

            if (createError) throw createError;
            console.log("Created new conversation:", newConversation.id);
            setConversationId(newConversation.id);
          }
        } else {
          // If there are conversations, use the first one
          console.log("Found existing conversation:", conversations[0].id);
          setConversationId(conversations[0].id);
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
