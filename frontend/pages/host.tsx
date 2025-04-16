// pages/host.tsx
import React from 'react';
import LiveStreamHost from '../components/LiveStreamHost';
import { UserProvider } from '../context/UserContext'; // make sure the path is correct
import '@/styles/globals.css';
const HostPage: React.FC = () => {
  return (
    <UserProvider>
      <LiveStreamHost />
    </UserProvider>
  );
};

export default HostPage;
