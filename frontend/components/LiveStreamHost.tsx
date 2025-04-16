"use client";

import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import { useUser } from '@/context/UserContext';
const apiUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';
let socket: any;
let peerConnection: RTCPeerConnection;

const LiveStreamHost: React.FC = () => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [propertyId, setPropertyId] = useState<string>('default-property');
  const { username, landlordId, refreshAccessToken, isTokenExpired, tenantId } = useUser(); 


  useEffect(() => {
    const url = new URL(window.location.href);
    const property = url.searchParams.get('property') || 'default-property';
    setPropertyId(property);

    const startStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        socket = io(apiUrl);

        socket.on('connect', async () => {
          // Notify server that landlord is starting stream
          socket.emit('start_stream', { propertyId, landlordId });

          // Also join the room to broadcast
          socket.emit('join_stream', { propertyId, tenantId: landlordId }); // landlord also joins the room

          peerConnection = createPeerConnection(socket, propertyId);

          stream.getTracks().forEach(track => {
            peerConnection.addTrack(track, stream);
          });

          const offer = await peerConnection.createOffer();
          await peerConnection.setLocalDescription(offer);

          socket.emit('offer', { propertyId, offer });
        });

        socket.on('answer', async (answer: RTCSessionDescriptionInit) => {
          await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        });

        socket.on('ice-candidate', async (candidate: RTCIceCandidateInit) => {
          try {
            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.error('Error adding received ice candidate', e);
          }
        });
      } catch (err) {
        console.error('Error accessing media devices.', err);
      }
    };

    startStream();

    return () => {
      socket?.emit('stop_stream', { propertyId, landlordId });
      socket?.disconnect();
      peerConnection?.close();
    };
  }, [propertyId]);

  const createPeerConnection = (socket: any, propertyId: string): RTCPeerConnection => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', { propertyId, candidate: event.candidate });
      }
    };

    return pc;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">
      <h1 className="text-white text-xl md:text-3xl font-bold mb-4">🔴 Broadcasting Live</h1>
      <video
        ref={localVideoRef}
        autoPlay
        muted
        playsInline
        className="rounded-xl border border-gray-400 shadow-lg w-full max-w-[600px] h-auto"
      />
    </div>
  );
};

export default LiveStreamHost;
