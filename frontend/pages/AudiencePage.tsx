'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AgoraRTC, { IAgoraRTCClient, ICameraVideoTrack } from 'agora-rtc-sdk-ng';
import "@/styles/globals.css";
const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;

console.log("Agora App ID:", appId);

if (!appId) {
  throw new Error('🚨 Agora App ID is missing! Please set NEXT_PUBLIC_AGORA_APP_ID in your .env.local file.');
}

const config = { mode: 'live', codec: 'vp8' } as const;

const AudiencePage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const channelName = searchParams?.get('channel') || '';
  const token = searchParams?.get('token') || ''; // This should be the Agora token passed from the backend
  const uidParam = searchParams?.get('uid');
  const uid = uidParam ? Number(uidParam) : null; // This should be the user ID from your application context

  const [client] = useState<IAgoraRTCClient>(() => AgoraRTC.createClient(config));
  const [users, setUsers] = useState<any[]>([]); // To store the users (the host and other audience members)

  useEffect(() => {
    const init = async () => {
      try {
        console.log('🚀 Initializing Agora client...');
        
        client.on('user-published', async (user, mediaType) => {
          await client.subscribe(user, mediaType);
          console.log('✅ Subscribed to user:', user.uid);

          if (mediaType === 'video') {
            setUsers((prevUsers) => [...prevUsers, user]);
            const container = document.getElementById(`user-${user.uid}`);
            if (container) {
              user.videoTrack?.play(container);
            }
          }
          if (mediaType === 'audio') {
            user.audioTrack?.play();
          }
        });

        client.on('user-unpublished', (user, mediaType) => {
          if (mediaType === 'video') {
            setUsers((prev) => prev.filter((u) => u.uid !== user.uid));
          }
          if (mediaType === 'audio') {
            user.audioTrack?.stop();
          }
        });

        console.log("✅ Agora Token Used in Join:", token);
        console.log('📡 Joining channel:', channelName);
        await client.join(appId, channelName, token, uid); 
        console.log('🎉 Successfully joined the channel');

        // 👇 This line is crucial for making the user a viewer (audience)
        await client.setClientRole('audience');
        console.log('🙌 Set client role to audience');

      } catch (error) {
        console.error('❌ Agora Init Error:', error);
      }
    };

    if (channelName && token && appId) {
      init();
    }

    // Cleanup function when the component unmounts
    return () => {
      console.log('🔚 Cleaning up...');
      client.leave();
    };
  }, [channelName, token]);

  return (
    <div>
      <h1>🎥 Live Stream: {channelName}</h1>
      <div id="video-streams">
        {users.map((user) => (
          <div
            key={user.uid}
            id={`user-${user.uid}`}
            style={{ width: 400, height: 300, background: '#222', marginTop: '1rem' }}
          />
        ))}
      </div>
    </div>
  );
};

export default AudiencePage;
