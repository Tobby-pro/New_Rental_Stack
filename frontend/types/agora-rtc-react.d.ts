// types/agora-rtc-react.d.ts
import type {
  IAgoraRTCClient,
  IMicrophoneAudioTrack,
  ICameraVideoTrack,
} from 'agora-rtc-sdk-ng';

declare module 'agora-rtc-react' {
  /** returns a hook that gives you the Agora client instance */
  export function createClient(
    config: { mode: 'live' | 'rtc'; codec: 'vp8' | 'h264' }
  ): () => IAgoraRTCClient;

  /** returns a hook that gives you [micTrack, cameraTrack] */
  export function createMicrophoneAndCameraTracks(): () => [
    IMicrophoneAudioTrack,
    ICameraVideoTrack
  ];
}
