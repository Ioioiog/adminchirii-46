
import React, { useCallback, useState } from "react";
import { Send, Smile, PaperclipIcon, Video, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import EmojiPicker from "emoji-picker-react";
import type { EmojiClickData } from "emoji-picker-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MessageInputProps {
  newMessage: string;
  setNewMessage: (message: string) => void;
  handleSendMessage: (e: React.FormEvent) => void;
  onStartVideoCall?: () => void;
}

export function MessageInput({
  newMessage,
  setNewMessage,
  handleSendMessage,
  onStartVideoCall
}: MessageInputProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setNewMessage(newMessage + emojiData.emoji);
  };

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please select an image, PDF, or document file.",
        variant: "destructive"
      });
      return;
    }

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 5MB.",
        variant: "destructive"
      });
      return;
    }

    setSelectedFile(file);
  }, [toast]);

  const handleFileUpload = async () => {
    if (!selectedFile) return null;

    try {
      setUploading(true);
      const fileExt = selectedFile.name.split('.').pop();
      const filePath = `${crypto.randomUUID()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('chat-attachments')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload file. Please try again.",
        variant: "destructive"
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() && !selectedFile) return;

    if (selectedFile) {
      const fileUrl = await handleFileUpload();
      if (fileUrl) {
        const fileMessage = `[File: ${selectedFile.name}](${fileUrl})`;
        setNewMessage(newMessage + " " + fileMessage);
      }
    }

    handleSendMessage(e);
    setSelectedFile(null);
    
    // Reset file input
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-white border-t">
      <div className="flex items-center gap-2 rounded-full p-2 border bg-gray-50">
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              type="button" 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 rounded-full hover:bg-gray-100"
            >
              <Smile className="h-5 w-5 text-gray-500" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start" side="top">
            <EmojiPicker onEmojiClick={onEmojiClick} />
          </PopoverContent>
        </Popover>

        <input
          type="file"
          id="file-input"
          className="hidden"
          onChange={handleFileSelect}
          accept="image/*,.pdf,.doc,.docx"
        />
        
        <Button 
          type="button" 
          variant="ghost" 
          size="icon" 
          className="h-9 w-9 rounded-full hover:bg-gray-100"
          onClick={() => document.getElementById('file-input')?.click()}
          disabled={uploading}
        >
          <PaperclipIcon className="h-5 w-5 text-gray-500" />
        </Button>

        <Button 
          type="button" 
          variant="ghost" 
          size="icon" 
          className="h-9 w-9 rounded-full hover:bg-gray-100"
          onClick={onStartVideoCall}
        >
          <Video className="h-5 w-5 text-gray-500" />
        </Button>

        <div className="flex-1 flex items-center gap-2">
          <input 
            value={newMessage} 
            onChange={e => setNewMessage(e.target.value)} 
            placeholder="Type a message" 
            className="flex-1 bg-transparent border-0 focus:ring-0 text-base text-gray-900 placeholder:text-gray-500" 
          />
          
          {selectedFile && (
            <div className="flex items-center gap-2 px-2 py-1 bg-blue-50 rounded-full">
              <span className="text-sm text-blue-600 truncate max-w-[150px]">
                {selectedFile.name}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-5 w-5 rounded-full hover:bg-blue-100"
                onClick={() => setSelectedFile(null)}
              >
                <X className="h-3 w-3 text-blue-600" />
              </Button>
            </div>
          )}
        </div>

        <Button 
          type="submit" 
          size="icon" 
          className="h-9 w-9 rounded-full bg-blue-500 hover:bg-blue-600" 
          disabled={(!newMessage.trim() && !selectedFile) || uploading}
        >
          <Send className="h-5 w-5 text-white" />
        </Button>
      </div>
    </form>
  );
}
