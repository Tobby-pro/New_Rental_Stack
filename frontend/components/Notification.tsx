// components/Notification.tsx
import React from 'react';

interface NotificationProps {
  message: string | null;
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-blue-500 text-white p-4 rounded">
      <span>{message}</span>
      <button onClick={onClose} className="ml-4 text-sm underline">
        Close
      </button>
    </div>
  );
};

export default Notification;
