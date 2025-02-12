
import React, { useEffect, useRef, useState } from 'react';
import SimplePeer from 'simple-peer';
import { Button } from '@/components/ui/button';
import { Video, Mic, MicOff, VideoOff, PhoneOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface VideoCallProps {
  conversationId: string;
  currentUserId: string;
  onClose: () => void;
}

export function VideoCall({ conversationId, currentUserId, onClose }: VideoCallProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [peer, setPeer] = useState<SimplePeer.Instance | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const startCall = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        setStream(mediaStream);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = mediaStream;
        }

        const newPeer = new SimplePeer({
          initiator: true,
          trickle: false,
          stream: mediaStream
        });

        newPeer.on('signal', async (data) => {
          // Send the signal data to the other peer through Supabase
          const { error } = await supabase
            .from('video_signals')
            .insert([{
              conversation_id: conversationId,
              sender_id: currentUserId,
              signal_data: data
            }]);

          if (error) {
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

        setPeer(newPeer);

        // Subscribe to incoming signals
        const channel = supabase
          .channel('video-signals')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'video_signals',
              filter: `conversation_id=eq.${conversationId}`
            },
            async (payload) => {
              if (payload.new.sender_id !== currentUserId) {
                newPeer.signal(payload.new.signal_data);
              }
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      } catch (error) {
        console.error('Error accessing media devices:', error);
        toast({
          title: "Error",
          description: "Could not access camera or microphone",
          variant: "destructive"
        });
      }
    };

    startCall();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (peer) {
        peer.destroy();
      }
    };
  }, [conversationId, currentUserId, toast]);

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

  const endCall = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    if (peer) {
      peer.destroy();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-slate-900 rounded-lg p-4 w-full max-w-4xl">
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
              Remote
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
            onClick={endCall}
          >
            <PhoneOff className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
