
import React from "react";
import { format } from "date-fns";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { MessageActions } from "./MessageActions";

interface MessageProps {
  id: string;
  content: string;
  senderName: string;
  createdAt: string;
  isCurrentUser: boolean;
  status: 'sent' | 'delivered' | 'read';
  isEditing: boolean;
  editedContent: string;
  onEditStart: (messageId: string, content: string) => void;
  onEditSave: (messageId: string) => void;
  onEditCancel: () => void;
  onEditChange: (content: string) => void;
  onDelete: (messageId: string) => void;
}

export function Message({
  id,
  content,
  senderName,
  createdAt,
  isCurrentUser,
  status,
  isEditing,
  editedContent,
  onEditStart,
  onEditSave,
  onEditCancel,
  onEditChange,
  onDelete,
}: MessageProps) {
  const messageTime = format(new Date(createdAt), 'HH:mm');

  // Function to check if content is an image attachment
  const isImageAttachment = (content: string) => {
    const fileMatch = content.match(/\[File: (.*?)\]\((.*?)\)/);
    if (!fileMatch) return false;
    
    const fileName = fileMatch[1].toLowerCase();
    return fileName.endsWith('.jpg') || 
           fileName.endsWith('.jpeg') || 
           fileName.endsWith('.png') || 
           fileName.endsWith('.gif') || 
           fileName.endsWith('.webp');
  };

  // Function to extract URL from markdown-style content
  const extractURL = (content: string) => {
    const match = content.match(/\[File: .*?\]\((.*?)\)/);
    return match ? match[1] : null;
  };

  return (
    <div className={cn(
      "flex mb-2 px-4 animate-fade-in group",
      isCurrentUser ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "max-w-[70%] relative",
        isCurrentUser ? "items-end" : "items-start"
      )}>
        <div className={cn(
          "rounded-2xl px-4 py-2",
          isCurrentUser 
            ? "bg-[#DCF8C6] dark:bg-emerald-800" 
            : "bg-white dark:bg-slate-700",
          "shadow-sm hover:shadow-md transition-shadow duration-200"
        )}>
          {!isCurrentUser && (
            <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">
              {senderName}
            </div>
          )}
          
          {isEditing ? (
            <div className="flex gap-2">
              <Input
                value={editedContent}
                onChange={(e) => onEditChange(e.target.value)}
                className="flex-1 h-8 text-sm bg-white/90"
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onEditSave(id)}
                className="h-8 w-8 p-0"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onEditCancel}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <>
              {isImageAttachment(content) ? (
                <div className="my-2">
                  <img 
                    src={extractURL(content)}
                    alt="Message attachment"
                    className="max-w-full rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
                    style={{ maxHeight: '300px' }}
                  />
                </div>
              ) : (
                <p className="text-gray-800 dark:text-gray-200 text-sm whitespace-pre-wrap break-words">
                  {content}
                </p>
              )}
              <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 flex justify-end items-center gap-1">
                {messageTime}
              </div>
            </>
          )}
        </div>
        
        {isCurrentUser && !isEditing && (
          <MessageActions
            status={status}
            onEdit={() => onEditStart(id, content)}
            onDelete={() => onDelete(id)}
          />
        )}
      </div>
    </div>
  );
}
