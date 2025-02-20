
import React from "react";
import { useUserRole } from "@/hooks/use-user-role";
import { MessageSquare, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ChatHeaderProps {
  selectedTenantId: string | null;
  onVideoCall?: () => void;
}

export function ChatHeader({ selectedTenantId, onVideoCall }: ChatHeaderProps) {
  const { userRole } = useUserRole();
  console.log("ChatHeader - selectedTenantId:", selectedTenantId); // Debug log

  return (
    <div className="p-4 border-b bg-white/80 backdrop-blur-md shadow-sm">
      <div className={cn("flex items-center justify-between gap-3", "animate-fade-in")}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <MessageSquare className="h-5 w-5 text-blue-500" />
          </div>
          <h1 className="text-lg font-semibold text-gray-800">
            {userRole === "landlord" ? "Chat with Tenants" : "Chat with Landlord"}
          </h1>
        </div>
        {selectedTenantId && (
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full hover:bg-gray-100/80 transition-colors"
            onClick={onVideoCall}
          >
            <Video className="h-5 w-5 text-gray-600" />
          </Button>
        )}
      </div>
    </div>
  );
}
