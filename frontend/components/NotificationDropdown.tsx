import React from 'react';
import { FiBell } from 'react-icons/fi';

interface NotificationDropdownProps {
  notifications: string[]; // Array of notification messages
  onBellClick: () => void; // Function to handle bell click
  hasNewNotification: boolean; // Boolean state for new notifications
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ notifications, onBellClick, hasNewNotification }) => {
  return (
    <div className="relative">
     
      
      {/* Notification Dropdown */}
      <div className="absolute right-0 mt-2 bg-white shadow-lg rounded-md w-48 overflow-hidden z-50">
        {notifications.length > 0 ? (
          notifications.map((note, index) => (
            <div key={index} className="p-2 border-b hover:bg-gray-100">
              {note}
            </div>
          ))
        ) : (
          <div className="p-2 text-gray-500">No new notifications</div>
        )}
      </div>
    </div>
  );
};

export default NotificationDropdown;
