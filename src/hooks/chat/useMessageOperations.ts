import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useMessageOperations() {
  const { toast } = useToast();

  const sendMessage = async (content: string, currentUserId: string | null, conversationId: string | null) => {
    if (!conversationId || !currentUserId || !content.trim()) {
      console.log("Missing required data for sending message:", {
        conversationId,
        currentUserId,
        contentLength: content?.length
      });
      return;
    }

    console.log("Sending message:", {
      conversationId,
      currentUserId,
      content
    });

    try {
      const { error } = await supabase
        .from("messages")
        .insert({
          content: content.trim(),
          sender_id: currentUserId,
          profile_id: currentUserId,
          conversation_id: conversationId,
          status: 'sent',
          read: false
        });

      if (error) {
        console.error("Error sending message:", error);
        toast({
          title: "Error",
          description: "Failed to send message. Please try again.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Unexpected error sending message:", err);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  return { sendMessage };
}