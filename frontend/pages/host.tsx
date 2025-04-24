'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { IAgoraRTCClient, IMicrophoneAudioTrack, ICameraVideoTrack } from 'agora-rtc-sdk-ng';
const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;
const config = { mode: 'live', codec: 'vp8' } as const;

const HostPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const channelName = searchParams?.get('channel') || '';
  const token = searchParams?.get('token') || '';
  const uidParam = searchParams?.get('uid');
  const uid = uidParam ? Number(uidParam) : null;

  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const [localTracks, setLocalTracks] = useState<[IMicrophoneAudioTrack?, ICameraVideoTrack?]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [started, setStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const init = async () => {
    if (!appId) {
      console.error('Missing Agora App ID');
      setError('Missing Agora App ID');
      return;
    }

    try {
      const AgoraRTC = (await import('agora-rtc-sdk-ng')).default;

      const client = AgoraRTC.createClient(config);
      clientRef.current = client;

      const [micTrack, camTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
      setLocalTracks([micTrack, camTrack]);

      client.on('user-published', async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        if (mediaType === 'video') {
          setUsers((prev) => [...prev, user]);
          const container = document.getElementById(`user-${user.uid}`);
          user.videoTrack?.play(container!);
        }
        if (mediaType === 'audio') user.audioTrack?.play();
      });

      client.on('user-unpublished', (user, mediaType) => {
        if (mediaType === 'video') {
          setUsers((prev) => prev.filter((u) => u.uid !== user.uid));
        }
      });

      await client.join(appId, channelName, token, uid);
      await client.setClientRole('host');
      await client.publish([micTrack, camTrack]);

      const localStream = document.getElementById('local-stream');
      camTrack.play(localStream!);
      setStarted(true);
      setError(null);
    } catch (err: any) {
      console.error('Agora Init Error:', err);
      if (err?.message?.includes('CAN_NOT_GET_GATEWAY_SERVER')) {
        setError('Session expired. Please click "Reconnect" to rejoin.');
      } else {
        setError('Failed to start live session. Please try again.');
      }
    }
  };

  // Retry init when tab becomes active again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && !started && !error) {
        console.log('[Agora] Retrying init on tab focus');
        init();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [started, error]);

  // Mount: initialize only if everything is present
  useEffect(() => {
    if (channelName && token && appId) {
      init();
    }

    return () => {
      const client = clientRef.current;
      client?.leave();
      localTracks.forEach((track) => {
        track?.stop();
        track?.close();
      });
    };
  }, [channelName, token]);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* 🔴 LIVE Badge */}
      {started && (
        <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-red-600 text-white text-sm font-semibold animate-pulse z-10 shadow-md">
          🔴 LIVE
        </div>
      )}

      {/* 🎥 Local Host Stream */}
      <div
        id="local-stream"
        className="w-full h-full object-cover bg-black"
      />

      {/* 🧑‍🤝‍🧑 Viewer Streams - Floating Windows */}
      <div className="absolute bottom-20 left-4 flex gap-2 z-10">
        {users.map((user) => (
          <div
            key={user.uid}
            id={`user-${user.uid}`}
            className="w-32 h-20 rounded-md bg-gray-800 shadow-md border-2 border-white animate-fade-in"
          />
        ))}
      </div>

      {/* ❌ Error Message */}
      {error && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 text-center text-red-500 font-semibold bg-black/70 px-4 py-2 rounded-md">
          {error}
          <button
            onClick={init}
            className="ml-4 bg-white text-black px-3 py-1 rounded hover:bg-gray-200 transition text-sm"
          >
            Reconnect
          </button>
        </div>
      )}

      {/* 🎛️ Control Buttons */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-6 z-10">
        <button
          className="bg-red-600 text-white px-5 py-2 rounded-full shadow-lg hover:bg-red-700 transition duration-200 font-semibold"
          onClick={() => router.push('/')}
        >
          End Live
        </button>
        <button
          className="bg-gray-900 text-white px-4 py-2 rounded-full shadow-md hover:bg-gray-700 transition duration-200 font-medium"
          onClick={() => alert('Switch camera coming soon')}
        >
          Switch Camera
        </button>
      </div>
    </div>
  );
};

export default HostPage;
