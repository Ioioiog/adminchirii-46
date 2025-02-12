
import React, { useState, useEffect } from "react";
import { Send, Smile } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";

interface MessageInputProps {
  newMessage: string;
  setNewMessage: (message: string) => void;
  handleSendMessage: (e: React.FormEvent) => void;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
}

export function MessageInput({ 
  newMessage, 
  setNewMessage, 
  handleSendMessage,
  onTypingStart,
  onTypingStop 
}: MessageInputProps) {
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeout = 1000;

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (newMessage && !isTyping) {
      setIsTyping(true);
      onTypingStart?.();
    }

    if (isTyping) {
      timer = setTimeout(() => {
        setIsTyping(false);
        onTypingStop?.();
      }, typingTimeout);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [newMessage, isTyping, onTypingStart, onTypingStop]);

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setNewMessage(newMessage + emojiData.emoji);
  };

  return (
    <TooltipProvider>
      <form onSubmit={handleSendMessage} className="p-4 border-t dark:border-gray-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-2"
          />
          
          <div className="flex items-center gap-1">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  <Smile className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="end">
                <EmojiPicker
                  onEmojiClick={onEmojiClick}
                  width="100%"
                  height={400}
                />
              </PopoverContent>
            </Popover>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  type="submit"
                  size="icon"
                  className="h-9 w-9 rounded-full"
                  disabled={!newMessage.trim()}
                >
                  <Send className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Send message</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </form>
    </TooltipProvider>
  );
}
