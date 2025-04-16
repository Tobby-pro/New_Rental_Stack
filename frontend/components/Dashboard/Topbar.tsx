import { FiSettings, FiSearch, FiMessageSquare, FiBell } from 'react-icons/fi';
import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import NotificationDropdown from '../NotificationDropdown';
import MessagesDropdown from '../MessagesDropdown';
import { useUser } from '@/context/UserContext';

interface TopbarProps {
  onSidebarToggle: () => void;
  username?: string;
  currentView: string;
  hasNewNotification: boolean;
  notifications: string[];
  landlordId: string | null;
  conversationId: string | null;
  socket: any;
}

interface MessagesResponse {
  [conversationId: string]: ConversationData;
}

interface ConversationData {
  landlordId: any;
  name?: string;
  lastMessage?: string;
  lastMessageDate?: string;
}

type ResponseData = Record<string, ConversationData>;

interface Message {
  landlordId: string | null;
  conversationId: string;
  lastMessage: string;
  lastMessageDate: string;
  tenantId: string;
  name?: string;
}

const Topbar = ({
  onSidebarToggle,
  username,
  currentView,
  hasNewNotification,
  notifications,
  landlordId,
  conversationId,
}: TopbarProps) => {
  const [currentDate, setCurrentDate] = useState<string>('');
  const [messageDropdownVisible, setMessageDropdownVisible] = useState<boolean>(false);
  const [notificationDropdownVisible, setNotificationDropdownVisible] = useState<boolean>(false);
  const [newMessageCount, setNewMessageCount] = useState<number>(0);
  const [tenantMessages, setTenantMessages] = useState<any[]>([]);
  const socketRef = useRef<any>(null);
  const [conversationIdState, setConversationIdState] = useState<string | null>(null);
  const [conversationMessages, setConversationMessages] = useState<any[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const messageDropdownRef = useRef<HTMLDivElement | null>(null);
  const { userId, userRole, token, tenantId, refreshAccessToken, isTokenExpired  } = useUser(); // Use the user context
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002';

  const formatDate = (dateString: string) => {
    const parsedDate = new Date(dateString);
    if (isNaN(parsedDate.getTime())) return 'Invalid Date';
    return parsedDate.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Handle clicks outside the dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close dropdown if click is outside of the dropdown
      if (messageDropdownRef.current && !messageDropdownRef.current.contains(event.target as Node)) {
        setMessageDropdownVisible(false);
      }
    };

    if (messageDropdownVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    // Cleanup event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [messageDropdownVisible]);

  // Handle socket connection based on user role (landlord or tenant)
  // Handle socket connection based on user role (landlord or tenant)
useEffect(() => {
  if (!userId || !userRole) return;

  const normalizedUserRole = userRole.toLowerCase(); // sanitize once at the top

  console.log("Initializing socket for user:", { userId, userRole });

  if (socketRef.current) {
    socketRef.current.disconnect();
  }

  const socketConnection = io(apiUrl, { transports: ['websocket'] });
  socketRef.current = socketConnection;

  if (normalizedUserRole === 'landlord') {
    socketConnection.emit('register_landlord', userId);

    socketConnection.on('new_message', (message: Message) => {
      console.log("New message received for landlord:", message);
      setTenantMessages((prev) => [message, ...prev]);
      setNewMessageCount((prev) => prev + 1);
    });
  } else if (normalizedUserRole === 'tenant') {
    socketConnection.emit('register_tenant', userId);

    socketConnection.on('new_message', (message: Message) => {
      console.log("New message received for tenant:", message);
      setTenantMessages((prev) => [message, ...prev]);
      setNewMessageCount((prev) => prev + 1);
    });
  }

  socketConnection.on('connect', () =>
    console.log(`Connected as ${normalizedUserRole.toUpperCase()}`)
  );

  return () => {
    socketConnection.off('new_message');
    socketConnection.disconnect();
  };
}, [apiUrl, userId, userRole]);


  useEffect(() => {
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    setCurrentDate(formattedDate);
  }, []);

  useEffect(() => {
    if (!landlordId || (userRole?.toLowerCase() ?? "") !== "landlord") {
      console.error('Permission denied: Invalid landlordId or user role');
      return; // Don't proceed with the API call if conditions are not met
    }

  const fetchTenantLandlordMessages = async (currentLandlordId: string) => {
  try {
    let validToken = token;

    // Check if token is missing or expired, then try to refresh it
    if (!validToken || isTokenExpired(validToken)) {
      validToken = await refreshAccessToken();
      if (!validToken) {
        console.error("Unable to refresh token.");
        return;
      }
    }

    console.log("Fetching tenant messages for landlordId:", currentLandlordId);
    console.log("Token:", validToken);

    const response = await axios.get<ResponseData>(
      `${apiUrl}/api/messages/landlord/${currentLandlordId}/conversations`,
      { headers: { Authorization: `Bearer ${validToken}` } }
    );

    console.log("API Response:", response.data);

    const mappedMessages = Object.entries(response.data).map(
      ([conversationId, conversationData]) => ({
        conversationId,
        name: conversationData.name || `Tenant ${conversationId}`,
        lastMessage: conversationData.lastMessage || 'No messages yet',
        lastMessageDate: conversationData.lastMessageDate
          ? formatDate(conversationData.lastMessageDate)
          : 'Date unavailable',
        read: false,
      })
    );

    console.log("Mapped Messages:", mappedMessages);

    setTenantMessages(mappedMessages);
    setNewMessageCount(mappedMessages.filter(msg => !msg.read).length);
  } catch (error) {
    console.error('Error fetching tenant messages:', error);
  }
};


    // Delay API call slightly to ensure latest `landlordId`
    const timeout = setTimeout(() => fetchTenantLandlordMessages(landlordId), 100);

    return () => clearTimeout(timeout); // Cleanup function
  }, [landlordId, token, userRole]); // Added userRole to the dependency array

  useEffect(() => {
  if (!tenantId || userRole?.toLowerCase() !== "tenant") {
    console.error('Permission denied: Invalid tenantId or user role');
    return;
  }

  const fetchLandlordTenantMessages = async (currentTenantId: string) => {
  try {
    let validToken = token;

    // Check if token is missing or expired, then try to refresh it
    if (!validToken || isTokenExpired(validToken)) {
      validToken = await refreshAccessToken();
      if (!validToken) {
        console.error("Unable to refresh token.");
        return;
      }
    }

    console.log("Fetching landlord messages for tenantId:", currentTenantId);
    console.log("Token:", validToken);

    const response = await axios.get<ResponseData>(
      `${apiUrl}/api/messages/tenant/${currentTenantId}/conversations`,
      { headers: { Authorization: `Bearer ${validToken}` } }
    );

    console.log("API Response (tenant):", response.data);

    const mappedMessages = Object.entries(response.data).map(
      ([conversationId, conversationData]) => ({
        conversationId,
        name: conversationData.name || `Landlord ${conversationId}`,
        lastMessage: conversationData.lastMessage || 'No messages yet',
        lastMessageDate: conversationData.lastMessageDate
          ? formatDate(conversationData.lastMessageDate)
          : 'Date unavailable',
        read: false,
        landlordId: conversationData.landlordId,
      })
    );

    setTenantMessages(mappedMessages);
    setNewMessageCount(
      mappedMessages.filter((msg) => !msg.read).length
    );
  } catch (error) {
    console.error("Error fetching landlord messages (tenant side):", error);
  }
};

  const timeout = setTimeout(
    () => fetchLandlordTenantMessages(tenantId),
    100
  );

  return () => clearTimeout(timeout);
}, [tenantId, token, userRole]);

  const toggleMessageDropdown = () => {
    setMessageDropdownVisible((prev) => !prev);
    setNotificationDropdownVisible(false);
    if (!messageDropdownVisible) {
      setNewMessageCount(0);
    }
  };

  const toggleNotificationDropdown = () => {
    setNotificationDropdownVisible((prev) => !prev);
    setMessageDropdownVisible(false);
  };

  const handleTenantClick = (tenantId: string, conversationId: string) => {
    setSelectedTenant(tenantId);
    setSelectedConversationId((prevId) => {
      console.log("Topbar updating selectedConversationId:", prevId, "→", conversationId);
      return conversationId;
    });
  };

  useEffect(() => {
    if (conversationIdState) {
      loadConversationMessages(conversationIdState);
    }
  }, [conversationIdState]);

  const loadConversationMessages = async (conversationId: string) => {
    try {
      const response = await axios.get(`${apiUrl}/api/messages/conversation/${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConversationMessages(response.data);
    } catch (error) {
      console.error('Topbar error loading conversation messages:', error);
    }
  };

  return (
    <div className="fixed  sm:relative sm:top-0 left-0 w-full sm:w-auto sm:z-auto z-50 top-0 flex justify-between items-center p-4 text-violet-500 bg-white border-b-2 border-gray-300 shadow-lg">
      <button className="md:hidden z-50 p-2 rounded-full" onClick={onSidebarToggle}>
        <FiSettings className="h-5 w-5" />
      </button>
      <div className="hidden md:block text-xl font-semibold">{currentView}</div>
      <div className="text-center text-sm md:text-sm lg:text-sm flex-1 md:flex-none font-sans tracking-wide">
        {currentDate}
      </div>
      <div className="flex space-x-4 items-center">
        <FiSearch className="h-5 w-5 cursor-pointer" />
        <div className="relative">
          <FiMessageSquare className="h-5 w-5 cursor-pointer" onClick={toggleMessageDropdown} />
          {newMessageCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
              {newMessageCount}
            </span>
          )}
          {messageDropdownVisible && (
            <div ref={messageDropdownRef}>
              <MessagesDropdown tenantMessages={tenantMessages} onTenantClick={handleTenantClick} landlordId={landlordId} />
            </div>
          )}
        </div>
        <div className="relative">
          <FiBell className="h-5 w-5 cursor-pointer" onClick={toggleNotificationDropdown} />
          {hasNewNotification && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
              {notifications.length}
            </span>
          )}
          {notificationDropdownVisible && (
            <NotificationDropdown notifications={notifications} onBellClick={() => {}} hasNewNotification={false} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Topbar;
