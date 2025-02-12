
import React, { useEffect, useRef, useState } from 'react';
import SimplePeer from 'simple-peer';
import { Button } from '@/components/ui/button';
import { Video, Mic, MicOff, VideoOff, PhoneOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import type { Database } from '@/integrations/supabase/types/database';

interface VideoCallProps {
  isOpen: boolean;
  onClose: () => void;
  recipientId: string;
  isInitiator: boolean;
}

type VideoSignal = Database['public']['Tables']['video_signals']['Insert'];
type SignalData = SimplePeer.SignalData;

export function VideoCall({ isOpen, onClose, recipientId, isInitiator }: VideoCallProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [peer, setPeer] = useState<SimplePeer.Instance | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;

    const requestMediaPermissions = async () => {
      try {
        // First check if permissions are already granted
        const permissions = await navigator.mediaDevices.enumerateDevices();
        const hasVideoPermission = permissions.some(device => device.kind === 'videoinput' && device.label);
        const hasAudioPermission = permissions.some(device => device.kind === 'audioinput' && device.label);

        if (!hasVideoPermission || !hasAudioPermission) {
          toast({
            title: "Permission Required",
            description: "Please allow access to your camera and microphone to start the video call.",
            duration: 5000,
          });
        }

        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });

        if (!mounted) {
          mediaStream.getTracks().forEach(track => track.stop());
          return;
        }

        setStream(mediaStream);
        setIsInitializing(false);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = mediaStream;
        }

        const newPeer = new SimplePeer({
          initiator: isInitiator,
          stream: mediaStream,
          trickle: false
        });

        setPeer(newPeer);

        newPeer.on('signal', async (data: SignalData) => {
          try {
            const currentUser = (await supabase.auth.getUser()).data.user;
            if (!currentUser?.id) return;

            const signalData: VideoSignal = {
              conversation_id: recipientId,
              sender_id: currentUser.id,
              signal_data: data as unknown as Database['public']['Tables']['video_signals']['Insert']['signal_data']
            };

            await supabase
              .from('video_signals')
              .insert([signalData]);
            
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

        const channel = supabase
          .channel('video-signals')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'video_signals'
            },
            async (payload: { new: Database['public']['Tables']['video_signals']['Row'] }) => {
              const currentUser = (await supabase.auth.getUser()).data.user;
              if (payload.new && payload.new.sender_id !== currentUser?.id) {
                newPeer.signal(payload.new.signal_data as SignalData);
              }
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      } catch (error) {
        console.error('Error initializing call:', error);
        if (error instanceof Error) {
          const errorMessage = error.name === 'NotAllowedError' 
            ? "Camera or microphone access was denied. Please check your browser permissions and try again."
            : "Could not access camera or microphone. Please make sure they are properly connected.";
          
          toast({
            title: "Permission Error",
            description: errorMessage,
            variant: "destructive",
            duration: 5000,
          });
        }
        setIsInitializing(false);
        onClose();
      }
    };

    requestMediaPermissions();

    return () => {
      mounted = false;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (peer) {
        peer.destroy();
      }
    };
  }, [isOpen, onClose, toast, isInitiator, recipientId]);

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
      setIsA