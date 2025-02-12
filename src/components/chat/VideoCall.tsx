
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
  const [isCallInitiator, setIsCallInitiator] = useState(true);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const initializeCallState = async () => {
      try {
        // Get user media stream
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        setStream(mediaStream);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = mediaStream;
        }

        // Check if there's an existing call signal for this conversation
        const { data: existingSignal } = await supabase
          .from('video_signals')
          .select('*')
          .eq('conversation_id', conversationId)
          .neq('sender_id', currentUserId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // If there's an existing signal, we're joining an existing call
        if (existingSignal) {
          setIsCallInitiator(false);
          initializePeer(mediaStream, false, existingSignal.signal_data);
        } else {
          // We're starting a new call
          setIsCallInitiator(true);
          initializePeer(mediaStream, true);
        }

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

    initializeCallState();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (peer) {
        peer.destroy();
      }
    };
  }, [conversationId, currentUserId, onClose, toast]);

  const initializePeer = (mediaStream: MediaStream, initiator: boolean, signalData?: any) => {
    const newPeer = new SimplePeer({
      initiator,
      trickle: false,
      stream: mediaStream
    });

    // Handle receiving signal data
    newPeer.on('signal', async (data) => {
      try {
        const { error } = await supabase
          .from('video_signals')
          .insert([{
            conversation_id: conversationId,
            sender_id: currentUserId,
            signal_data: data
          }]);

        if (error) {
          throw error;
        }
      } catch (error) {
        console.error('Error sending signal:', error);
        toast({
          title: "Error",
          description: "Failed to establish video connection",
          variant: "destructive"
        });
      }
    });

    // Handle receiving remote stream
    newPeer.on('stream', (remoteStream) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    });

    // If we're joining an existing call, signal the peer with the existing data
    if (signalData) {
      newPeer.signal(signalData);
    }

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
        (payload) => {
          if (payload.new.sender_id !== currentUserId) {
            newPeer.signal(payload.new.signal_data);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
              {isCallInitiator ? 'Tenant' : 'Landlord'}
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
