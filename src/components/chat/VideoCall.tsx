
import React, { useEffect, useRef, useState } from 'react';
import SimplePeer from 'simple-peer';
import { Button } from '@/components/ui/button';
import { Video, Mic, MicOff, VideoOff, PhoneOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface VideoCallProps {
  isOpen: boolean;
  onClose: () => void;
  recipientId: string;
  isInitiator: boolean;
}

export function VideoCall({ isOpen, onClose, recipientId, isInitiator }: VideoCallProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [peer, setPeer] = useState<SimplePeer.Instance | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const initializeCallState = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        setStream(mediaStream);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = mediaStream;
        }

        initializePeer(mediaStream);

      } catch (error) {
        console.error('Error initializing call:', error);
        toast({
          title: "Error",
          description: "Could not access camera or microphone",
          variant: "destructive"
        });
        onClose();
      }
    };

    if (isOpen) {
      initializeCallState();
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (peer) {
        peer.destroy();
      }
    };
  }, [isOpen, onClose, toast]);

  const initializePeer = async (mediaStream: MediaStream) => {
    try {
      const newPeer = new SimplePeer({
        initiator: isInitiator,
        trickle: false,
        stream: mediaStream,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' }
          ]
        }
      });

      newPeer.on('signal', async (data) => {
        try {
          const currentUser = (await supabase.auth.getUser()).data.user;
          if (!currentUser?.id) return;

          const { error } = await supabase
            .from('video_signals')
            .insert({
              conversation_id: recipientId,
              sender_id: currentUser.id,
              signal_data: data
            } as any); // Temporary type assertion while we update the types

          if (error) throw error;
        } catch (error) {
          console.error('Error sending signal:', error);
          toast({
            title: "Error",
            description: "Failed to establish video connection",
            variant: "destructive"
          });
        }
      });

      newPeer.on('stream', (remoteStream) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
      });

      newPeer.on('error', (err) => {
        console.error('Peer error:', err);
        toast({
          title: "Connection Error",
          description: "There was an error with the video call",
          variant: "destructive"
        });
      });

      setPeer(newPeer);

      // Subscribe to incoming signals
      const channel = supabase
        .channel('video-signals')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'video_signals'
          },
          async (payload: any) => {
            const currentUser = (await supabase.auth.getUser()).data.user;
            if (payload.new && payload.new.sender_id !== currentUser?.id) {
              newPeer.signal(payload.new.signal_data);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (error) {
      console.error('Error initializing peer:', error);
      toast({
        title: "Connection Error",
        description: "Failed to initialize video call",
        variant: "destructive"
      });
    }
  };

  const toggleVideo = () => {
    if (stream) {
      stream.getVideoTracks().forEach(track => {
        track.enabled = !isVideoEnabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const toggleAudio = () => {
    if (stream) {
      stream.getAudioTracks().forEach(track => {
        track.enabled = !isAudioEnabled;
      });
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  const handleClose = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    if (peer) {
      peer.destroy();
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[900px]">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="relative aspect-video bg-slate-900 rounded-lg overflow-hidden">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 text-white text-sm bg-black/50 px-2 py-1 rounded">
              You
            </div>
          </div>
          <div className="relative aspect-video bg-slate-900 rounded-lg overflow-hidden">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 text-white text-sm bg-black/50 px-2 py-1 rounded">
              {isInitiator ? 'Tenant' : 'Landlord'}
            </div>
          </div>
        </div>
        <div className="flex justify-center gap-4">
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full"
            onClick={toggleVideo}
          >
            {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full"
            onClick={toggleAudio}
          >
            {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </Button>
          <Button
            variant="destructive"
            size="icon"
            className="rounded-full"
            onClick={handleClose}
          >
            <PhoneOff className="h-5 w-5" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
