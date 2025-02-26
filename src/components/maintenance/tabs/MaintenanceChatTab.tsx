
import React, { useRef, useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare } from "lucide-react";
import { useUserRole } from "@/hooks/use-user-role";

interface ChatMessage {
  id: string;
  sender_id: string;
  message: string;
  created_at: string;
  sender?: {
    first_name: string | null;
    last_name: string | null;
    role: string;
  };
}

interface MaintenanceChatTabProps {
  requestId: string;
}

export function MaintenanceChatTab({ requestId }: MaintenanceChatTabProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { userRole } = useUserRole();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!requestId) return;

    const fetchMessages = async () => {
      try {
        console.log("Fetching chat messages for request:", requestId);
        const { data, error } = await supabase
          .from('maintenance_request_chats')
          .select(`
            *,
            sender:profiles!maintenance_request_chats_sender_id_fkey(
              first_name,
              last_name,
              role
            )
          `)
          .eq('request_id', requestId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        console.log("Fetched messages:", data);
        setMessages(data || []);
      } catch (error) {
        console.error('Error fetching messages:', error);
        toast({
          title: "Error",
          description: "Failed to load chat messages",
          variant: "destructive",
        });
      }
    };

    fetchMessages();

    const channel = supabase
      .channel(`maintenance_chat_${requestId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'maintenance_request_chats',
          filter: `request_id=eq.${requestId}`
        },
        async (payload) => {
          console.log('New message received:', payload);
          const { data, error } = await supabase
            .from('maintenance_request_chats')
            .select(`
              *,
              sender:profiles!maintenance_request_chats_sender_id_fkey(
                first_name,
                last_name,
                role
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (error) {
            console.error('Error fetching new message details:', error);
            return;
          }

          setMessages(prev => [...prev, data]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [requestId, toast]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !requestId) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('maintenance_request_chats')
        .insert({
          request_id: requestId,
          sender_id: (await supabase.auth.getUser()).data.user?.id,
          message: newMessage.trim()
        });

      if (error) throw error;

      setNewMessage("");
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully.",
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getMessageStyle = (role: string) => {
    switch (role) {
      case 'tenant':
        return userRole === 'tenant' 
          ? 'bg-blue-100 dark:bg-blue-900'
          : 'bg-gray-100 dark:bg-gray-800';
      case 'landlord':
        return userRole === 'landlord'
          ? 'bg-blue-100 dark:bg-blue-900'
          : 'bg-gray-100 dark:bg-gray-800';
      case 'service_provider':
        return 'bg-purple-100 dark:bg-purple-900';
      default:
        return 'bg-gray-100 dark:bg-gray-800';
    }
  };

  return (
    <>
      <ScrollArea className="h-[400px] p-4 border rounded-lg">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender?.role === 'tenant'
                  ? 'justify-start'
                  : message.sender?.role === 'landlord'
                  ? 'justify-end'
                  : 'justify-center'
              }`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${getMessageStyle(message.sender?.role || '')}`}
              >
                <div className="text-xs font-medium mb-1">
                  {message.sender?.first_name} {message.sender?.last_name} ({message.sender?.role})
                </div>
                <p className="text-sm">{message.message}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      
      <form onSubmit={handleSendMessage} className="flex gap-2">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1"
        />
        <Button type="submit" disabled={!newMessage.trim() || isLoading}>
          Send
        </Button>
      </form>
    </>
  );
}
