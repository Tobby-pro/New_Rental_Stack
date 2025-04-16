"use client";
import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

const SOCKET_SERVER_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';

const LiveStreamViewer: React.FC = () => {
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const [propertyId, setPropertyId] = useState<string>('default-property');
  const [socket, setSocket] = useState<any>(null);

  // Chat state
  const [messages, setMessages] = useState<{ userId: string; text: string }[]>([]);
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      setPropertyId(url.searchParams.get('property') || 'default-property');
    }

    let socketInstance: any;

    const init = async () => {
      socketInstance = io(SOCKET_SERVER_URL);
      setSocket(socketInstance);

      socketInstance.on('connect', async () => {
        socketInstance.emit('join_stream', { propertyId, tenantId: socketInstance.id });

        const peerConnection = createPeerConnection(socketInstance, propertyId);
        peerConnectionRef.current = peerConnection;

        peerConnection.ontrack = (event) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        };
      });

      socketInstance.on('offer', async (offer: RTCSessionDescriptionInit) => {
        const pc = peerConnectionRef.current;
        if (!pc) return;

        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socketInstance.emit('answer', { propertyId, answer });
      });

      socketInstance.on('ice-candidate', async (candidate: RTCIceCandidateInit) => {
        try {
          await peerConnectionRef.current?.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error('Error adding ice candidate:', e);
        }
      });

      // Listen for chat messages
      socketInstance.on('chat_message', (msg: { userId: string; text: string }) => {
        setMessages((prev) => [...prev, msg]);
      });
    };

    init();

    return () => {
      socketInstance?.disconnect();
      peerConnectionRef.current?.close();
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

  const handleSendMessage = () => {
    if (message.trim() === '' || !socket) return;

    const msg = { userId: 'Tenant', text: message }; // Change 'Tenant' to actual userId if available
    socket.emit('chat_message', msg);
    setMessages((prev) => [...prev, msg]);
    setMessage('');
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-screen bg-black p-4 text-white">
      {/* Video Section */}
      <div className="flex-1 flex flex-col items-center justify-start">
        <h1 className="text-xl md:text-3xl font-bold mb-4">👀 Watching Live Stream</h1>
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          controls={false}
          className="rounded-xl border border-gray-400 shadow-lg w-full max-w-[90vw] sm:max-w-[600px] h-auto"
        />
      </div>

      {/* Chat Section */}
      <div className="w-full lg:w-[400px] bg-gray-900 rounded-xl shadow-lg flex flex-col">
        <div className="px-4 py-2 border-b border-gray-700 text-lg font-semibold">💬 Live Chat</div>
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
          {messages.map((msg, idx) => (
            <div key={idx} className="bg-gray-800 p-2 rounded-md">
              <span className="font-bold text-blue-400">{msg.userId}:</span>{' '}
              <span className="text-gray-200">{msg.text}</span>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="flex border-t border-gray-700">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-gray-800 px-3 py-2 text-white outline-none rounded-bl-xl"
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <button
            onClick={handleSendMessage}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-br-xl"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default LiveStreamViewer;
