
import React, { useRef, useState, useEffect } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { MessageList } from "@/components/chat/MessageList";
import { MessageInput } from "@/components/chat/MessageInput";
import { useConversation } from "@/hooks/chat/useConversation";
import { useMessages } from "@/hooks/chat/useMessages";
import { useAuthState } from "@/hooks/useAuthState";
import { Loader2, Search, X } from "lucide-react";
import { useUserRole } from "@/hooks/use-user-role";
import { VideoCall } from "@/components/chat/VideoCall";
import { useTenants } from "@/hooks/useTenants";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChatBackground } from "@/components/chat/ChatBackground";
import { Badge } from "@/components/ui/badge";
import { useSidebarNotifications } from "@/hooks/use-sidebar-notifications";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, Video, PaperclipIcon, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";

const Chat = () => {
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isVideoCallActive, setIsVideoCallActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { currentUserId } = useAuthState();
  const { conversationId, isLoading: isConversationLoading } = useConversation(currentUserId, selectedTenantId);
  const { messages, sendMessage } = useMessages(conversationId);
  const { userRole } = useUserRole();
  const { data: tenants, isLoading: isTenantsLoading } = useTenants();
  const { data: notifications } = useSidebarNotifications();

  const messageNotification = notifications?.find(n => n.type === 'messages');

  console.log('Raw message notification:', messageNotification);

  const uniqueTenants = tenants?.reduce((acc, current) => {
    const existingTenant = acc.find(item => item.email === current.email);
    if (!existingTenant) {
      acc.push(current);
    }
    return acc;
  }, [] as typeof tenants extends (infer T)[] ? T[] : never) || [];

  const unreadMessagesByTenant = messageNotification?.items?.reduce((acc, message) => {
    if (message.sender_id) {
      console.log('Processing message notification:', {
        messageId: message.id,
        senderId: message.sender_id,
        currentCount: acc[message.sender_id] || 0
      });
      acc[message.sender_id] = (acc[message.sender_id] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>) || {};

  const filteredTenants = uniqueTenants?.filter(tenant => {
    const fullName = `${tenant.first_name || ''} ${tenant.last_name || ''}`.toLowerCase();
    const email = tenant.email?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || email.includes(query);
  });

  const handleTenantSelect = (tenantId: string) => {
    console.log("Selected tenant:", tenantId);
    setSelectedTenantId(tenantId);
  };

  const handleStartVideoCall = () => {
    if (selectedTenantId) {
      setIsVideoCallActive(true);
    }
  };

  const handleEndVideoCall = () => {
    setIsVideoCallActive(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      await sendMessage(newMessage, currentUserId);
      setNewMessage("");
    }
  };

  useEffect(() => {
    const markMessagesAsRead = async () => {
      if (!selectedTenantId || !messages || messages.length === 0) return;

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.id) return;

        const unreadMessages = messages.filter(msg => 
          msg.sender_id !== user.id && !msg.read
        );

        if (unreadMessages.length === 0) return;

        console.log('Marking messages as read:', unreadMessages.length);

        const batchSize = 10;
        for (let i = 0; i < unreadMessages.length; i += batchSize) {
          const batch = unreadMessages.slice(i, i + batchSize);
          const { error } = await supabase
            .from('messages')
            .update({
              read: true,
              status: 'read',
              updated_at: new Date().toISOString()
            })
            .in('id', batch.map(msg => msg.id));

          if (error) throw error;
        }

        console.log('Messages marked as read successfully');
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    };

    markMessagesAsRead();
  }, [messages, selectedTenantId]);

  const renderChatContent = () => {
    if (isConversationLoading) {
      return <div className="flex-1 flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>;
    }
    if (!conversationId) {
      return <div className="relative flex-1 flex items-center p-8 text-center bg-gradient-to-br from-blue-500/5 to-blue-600/5">
        <ChatBackground />
        <div className="relative z-10 max-w-md glass-card p-8 rounded-xl backdrop-blur-sm bg-white/80 ml-8">
          <div className="absolute top-2 right-2">
            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
              <X className="h-4 w-4 text-gray-400" />
            </Button>
          </div>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl" role="img" aria-label="chat">💬</span>
          </div>
          <h3 className="text-lg font-semibold mb-2 text-gray-800">
            {userRole === "landlord" ? "Select a Conversation" : "Chat with Your Landlord"}
          </h3>
          <p className="text-gray-600 mb-6">
            {userRole === "landlord" 
              ? "Choose a tenant from the list to start chatting ✨"
              : "Your landlord will be notified when you send a message ✨"}
          </p>
          
          <div className="space-y-6 text-left">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-gray-700 mb-2">Chat Features:</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" /> Send text messages instantly
                </li>
                <li className="flex items-center gap-2">
                  <Video className="h-4 w-4" /> Start video calls for real-time communication
                </li>
                <li className="flex items-center gap-2">
                  <PaperclipIcon className="h-4 w-4" /> Share images and documents
                </li>
                <li className="flex items-center gap-2">
                  <Smile className="h-4 w-4" /> Express yourself with emojis
                </li>
              </ul>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-700 mb-2">Quick Tips:</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Messages are delivered instantly</li>
                <li>• You'll receive notifications for new messages</li>
                <li>• Video calls require camera and microphone permissions</li>
                <li>• Files up to 5MB are supported</li>
              </ul>
            </div>
            
            {userRole === "tenant" && (
              <Button 
                className="w-full mt-4 bg-blue-600 hover:bg-blue-700" 
                onClick={() => {
                  // If there are any landlords in the tenants list, select the first one
                  const landlord = uniqueTenants.find(t => t.role === "landlord");
                  if (landlord) {
                    handleTenantSelect(landlord.id);
                  }
                }}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Start Conversation with Your Landlord
              </Button>
            )}
          </div>
        </div>
      </div>;
    }
    return <>
      <MessageList messages={messages} currentUserId={currentUserId} messagesEndRef={messagesEndRef} className="flex-1 h-full" />
      <MessageInput newMessage={newMessage} setNewMessage={setNewMessage} handleSendMessage={handleSendMessage} onStartVideoCall={handleStartVideoCall} />
    </>;
  };

  console.log('Unread messages by tenant:', unreadMessagesByTenant);
  console.log('Message notifications:', messageNotification?.items);
  console.log('Current tenants:', uniqueTenants);

  return (
    <div className="min-h-screen flex w-full bg-[#F1F0FB]">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col h-screen">
        <div className="flex flex-1 overflow-hidden">
          {userRole === "landlord" && (
            <div className="w-80 bg-white border-r border-gray-100 flex flex-col shadow-sm">
              <div className="p-4 border-b border-gray-100">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search tenants..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-gray-50/50 border-gray-100 focus:border-blue-100 focus:ring-blue-100/50"
                  />
                </div>
              </div>
              <ScrollArea className="flex-1">
                {isTenantsLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                  </div>
                ) : (
                  <div className="space-y-0.5 p-2">
                    {filteredTenants?.map((tenant) => {
                      const unreadCount = unreadMessagesByTenant[tenant.id] || 0;
                      console.log(`Tenant ${tenant.id} unread count:`, unreadCount); // Debug log
                      
                      return (
                        <button
                          key={tenant.id}
                          onClick={() => handleTenantSelect(tenant.id)}
                          className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                            selectedTenantId === tenant.id
                              ? "bg-blue-50/80 hover:bg-blue-50"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          <Avatar className="shadow-sm border border-gray-100">
                            <AvatarFallback className="bg-blue-500 text-white font-medium">
                              {tenant.first_name?.[0] || tenant.email?.[0] || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 text-left">
                            <div className="font-medium text-sm text-gray-800 flex items-center gap-2">
                              {tenant.first_name && tenant.last_name
                                ? `${tenant.first_name} ${tenant.last_name}`
                                : tenant.email}
                              {unreadCount > 0 && (
                                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                                  {unreadCount} new
                                </Badge>
                              )}
                            </div>
                            {tenant.property?.name && (
                              <div className="text-xs text-gray-500 truncate">
                                {tenant.property.name}
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}

          <div className="flex-1 flex flex-col overflow-hidden bg-white rounded-lg shadow-lg m-4">
            <ChatHeader
              selectedTenantId={selectedTenantId}
              onVideoCall={handleStartVideoCall}
            />
            <div className="flex-1 flex flex-col min-h-0 bg-[#F1F0FB] bg-[url('/chat-background.png')] bg-repeat">
              {renderChatContent()}
            </div>
          </div>
        </div>
      </div>

      {isVideoCallActive && conversationId && currentUserId && selectedTenantId && (
        <VideoCall
          isOpen={isVideoCallActive}
          onClose={handleEndVideoCall}
          recipientId={selectedTenantId}
          isInitiator={true}
        />
      )}
    </div>
  );
};

export default Chat;
