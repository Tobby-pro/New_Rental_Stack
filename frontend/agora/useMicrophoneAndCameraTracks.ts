import AgoraRTC, {
  ICameraVideoTrack,
  IMicrophoneAudioTrack
} from 'agora-rtc-sdk-ng';
import { useState, useEffect } from 'react';

export const useMicrophoneAndCameraTracks = () => {
  const [tracks, setTracks] = useState<[IMicrophoneAudioTrack?, ICameraVideoTrack?]>([]);

  useEffect(() => {
    let isMounted = true;

    const initTracks = async () => {
      try {
        const [microphoneTrack, cameraTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
        if (isMounted) setTracks([microphoneTrack, cameraTrack]);
      } catch (error) {
        console.error("Error initializing tracks:", error);
      }
    };

    initTracks();

    return () => {
      isMounted = false;

      // Optional cleanup if you want to stop and close tracks
      tracks.forEach((track) => {
        if (track && track.stop) track.stop();
        if (track && track.close) track.close();
      });
    };
  }, []);

  return tracks;
};
