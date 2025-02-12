import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoCallProps {
  isOpen: boolean;
  onClose: () => void;
  recipientId: string;
  isInitiator: boolean;
}

export function VideoCall({ isOpen, onClose, recipientId, isInitiator }: VideoCallProps) {
  const { t } = useTranslation('chat', { keyPrefix: 'videoCall' });
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    if (isOpen) {
      initializeCall();
    }
    return () => {
      cleanupCall();
    };
  }, [isOpen]);

  const initializeCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Initialize WebRTC peer connection
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' }
        ]
      });
      peerConnection.current = pc;

      // Add local stream to peer connection
      stream.getTracks().forEach(track => {
        if (localStream) {
          pc.addTrack(track, localStream);
        }
      });

      // Handle incoming stream
      pc.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      if (isInitiator) {
        // Create and send offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        // TODO: Send offer to recipient through your signaling server
      }
    } catch (error) {
      console.error('Error initializing call:', error);
    }
  };

  const cleanupCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (peerConnection.current) {
      peerConnection.current.close();
    }
    setLocalStream(null);
    setRemoteStream(null);
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const handleEndCall = () => {
    cleanupCall();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>{t('videoCall.title')}</DialogTitle>
          <DialogDescription>
            {t('videoCall.connecting')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-4 mt-4">
          {/* Remote Video */}
          <div className="relative col-span-2 aspect-video bg-slate-900 rounded-lg overflow-hidden">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            
            {/* Local Video (Picture-in-Picture) */}
            <div className="absolute bottom-4 right-4 w-48 aspect-video bg-slate-800 rounded-lg overflow-hidden">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4 mt-4">
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "rounded-full",
              isMuted && "bg-red-500 hover:bg-red-600 text-white"
            )}
            onClick={toggleMute}
          >
            {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>

          <Button
            variant="destructive"
            size="icon"
            className="rounded-full"
            onClick={handleEndCall}
          >
            <PhoneOff className="h-5 w-5" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            className={cn(
              "rounded-full",
              isVideoOff && "bg-red-500 hover:bg-red-600 text-white"
            )}
            onClick={toggleVideo}
          >
            {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
