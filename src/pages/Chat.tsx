
import React, { useRef, useState } from "react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { MessageList } from "@/components/chat/MessageList";
import { MessageInput } from "@/components/chat/MessageInput";
import { useConversation } from "@/hooks/chat/useConversation";
import { useMessages } from "@/hooks/chat/useMessages";
import { useAuthState } from "@/hooks/useAuthState";
import { Loader2, Search } from "lucide-react";
import { useUserRole } from "@/hooks/use-user-role";
import { VideoCall } from "@/components/chat/VideoCall";
import { useTenants } from "@/hooks/useTenants";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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

  const uniqueTenants = tenants?.reduce((acc, current) => {
    const existingTenant = acc.find(item => item.email === current.email);
    if (!existingTenant) {
      acc.push(current);
    }
    return acc;
  }, [] as typeof tenants extends (infer T)[] ? T[] : never) || [];

  const filteredTenants = uniqueTenants?.filter(tenant => {
    const fullName = `${tenant.first_name || ''} ${tenant.last_name || ''}`.toLowerCase();
    const email = tenant.email?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || email.includes(query);
  });

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      await sendMessage(newMessage, currentUserId);
      setNewMessage("");
    }
  };

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

  const renderChatContent = () => {
    if (isConversationLoading) {
      return (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      );
    }

    if (!conversationId) {
      return (
        <div className="flex-1 flex items-center justify-center p-8 text-center bg-[#F1F0FB] dark:bg-slate-900">
          <div className="max-w-md glass-card p-8 rounded-xl">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageList 
                messages={[]}
                currentUserId={currentUserId}
                messagesEndRef={messagesEndRef}
                className="w-8 h-8 text-blue-500"
              />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-gray-800">Select a Conversation</h3>
            <p className="text-gray-600">
              Choose a tenant from the list to start chatting.
            </p>
          </div>
        </div>
      );
    }

    return (
      <>
        <MessageList
          messages={messages}
          currentUserId={currentUserId}
          messagesEndRef={messagesEndRef}
          className="flex-1 h-full"
        />
        <MessageInput
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          handleSendMessage={handleSendMessage}
          onStartVideoCall={handleStartVideoCall}
        />
      </>
    );
  };

  return (
    <div className="flex h-screen bg-[#F1F0FB] dark:bg-slate-900">
      <DashboardSidebar />
      <div className="flex-1 flex">
        {userRole === "landlord" && (
          <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search tenants..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-gray-50"
                />
              </div>
            </div>
            <ScrollArea className="flex-1">
              {isTenantsLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {filteredTenants?.map((tenant) => (
                    <button
                      key={tenant.id}
                      onClick={() => handleTenantSelect(tenant.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors ${
                        selectedTenantId === tenant.id
                          ? "bg-blue-50 dark:bg-blue-900/20"
                          : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      }`}
                    >
                      <Avatar>
                        <AvatarFallback className="bg-blue-500 text-white">
                          {tenant.first_name?.[0] || tenant.email?.[0] || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left">
                        <div className="font-medium text-sm">
                          {tenant.first_name && tenant.last_name 
                            ? `${tenant.first_name} ${tenant.last_name}`
                            : tenant.email}
                        </div>
                        {tenant.property?.name && (
                          <div className="text-xs text-gray-500 truncate">
                            {tenant.property.name}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
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
