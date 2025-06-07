'use client';

import { Toaster } from 'react-hot-toast';

const ToasterProvider = () => {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        // Global styles for all toasts
        style: {
          fontSize: '14px',
        },
        // Specific style overrides for success toasts
        success: {
          style: {
            background: '#1e40af', // blue-800
            color: '#ffffff',
          },
          iconTheme: {
            primary: '#ffffff',
            secondary: '#1e40af',
          },
        },
        // You can also customize error, loading etc. if needed
      }}
    />
  );
};

export default ToasterProvider;
