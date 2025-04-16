'use client';
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { FiHome, FiKey, FiMessageSquare, FiList, FiSettings } from 'react-icons/fi';
import axios from 'axios';
import io from 'socket.io-client';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface UserContextType {
  landlordId: string | null;
  username: string;
  setUsername: (name: string) => void;
  users: User[];
  userRole: string | null;
  sidebarLinks: { name: string; icon: React.ElementType }[];
  token: string | null;
  userId: string | null;
  conversationId: string | null;
  setConversationId: (id: string | null) => void;
  tenantId: string | null;
  notifications: any[];
  refreshAccessToken: () => Promise<string | null>;

  isTokenExpired: (token: string | null) => boolean;
}

const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002');

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [username, setUsername] = useState<string>('Guest');
  const [users, setUsers] = useState<User[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [sidebarLinks, setSidebarLinks] = useState<{ name: string; icon: React.ElementType }[]>([
    { name: 'Home', icon: FiHome },
  ]);
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [landlordId, setLandlordId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);

  const socketRef = useRef<any>(null); // Reference for socket instance
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002';

  // Function to check if the token has expired
  const isTokenExpired = (token: string | null) => {
    if (!token) return true;

    try {
      const decoded = JSON.parse(atob(token.split('.')[1])); // Decode JWT
      const expirationTime = decoded?.exp;
      const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds

      return expirationTime < currentTime; // If expired, return true
    } catch (error) {
      console.error('Invalid token format:', error);
      return true; // If there's an error decoding the token, treat it as expired
    }
  };

  // Function to refresh the access token
 const refreshAccessToken = async (): Promise<string | null> => {
  try {
    console.log('🔄 Trying to refresh token...');

    const response = await axios.post(`${apiUrl}/refresh`, {}, {
      withCredentials: true,
    });

    if (response.status === 200) {
      const data = response.data;
      console.log('✅ Refresh success:', data.accessToken);

      localStorage.setItem('token', data.accessToken);
      setToken(data.accessToken);
      return data.accessToken; // ✅ Return the new token
    } else {
      throw new Error('Failed to refresh token');
    }
  } catch (error: any) {
    console.error('❌ Token refresh failed', error?.response?.data || error.message);
    return null; // ✅ Return null on failure
  }
};

  const setConversationIdWithStorage = (id: string | null) => {
    if (id) {
      localStorage.setItem('conversationId', id);
    } else {
      localStorage.removeItem('conversationId');
    }
    setConversationId(id);
    window.location.reload(); // Consider avoiding this unless necessary
  };

  // Utility functions for validation
  const isValidToken = (token: string | null) => token && token.length > 0;
  const isValidUserId = (userId: string | null) => userId && !isNaN(Number(userId));

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUserId = localStorage.getItem('userId');
    const storedUserRole = localStorage.getItem('userRole');
    const storedConversationId = localStorage.getItem('conversationId');
    const storedLandlordId = localStorage.getItem('landlordId');
    const stroedTenantId = localStorage.getItem('tenantId');

    if (storedToken) setToken(storedToken);
    if (storedUserId) setUserId(storedUserId);
    if (storedUserRole) {
      setUserRole(storedUserRole);
      updateSidebarLinks(storedUserRole);
    }
    if (storedConversationId) setConversationId(storedConversationId);
    if (storedLandlordId) setLandlordId(storedLandlordId);
  }, []);

  useEffect(() => {
    // Ensure token is valid before making any API request
  const checkTokenAndFetchData = async () => {
  let validToken = token;

  if (isTokenExpired(token)) {
    const newToken = await refreshAccessToken();
    if (!newToken) return;
    validToken = newToken; // ✅ Use the new token right away
  }

  if (isValidToken(validToken) && isValidUserId(userId)) {
    const headers = { Authorization: `Bearer ${validToken}`, Accept: 'application/json' };

    axios
      .get(`${apiUrl}/api/users/${userId}`, { headers })
      .then((response) => {
        console.log('Fetched User Data:', response.data);
        const userName = response.data?.name;
        const tenantIdFromApi = response.data?.tenantId;

        if (userName) setUsername(userName);
        if (tenantIdFromApi) {
          setTenantId(tenantIdFromApi);
          localStorage.setItem('tenantId', tenantIdFromApi);
        }
        if (response.data.landlordId) setLandlordId(response.data.landlordId);
      })
      .catch((error) => console.error('Error fetching user data:', error));
  }
};


    checkTokenAndFetchData();
  }, [apiUrl, token, userId]);

  useEffect(() => {
    socket.on('userDetails', (data) => {
      console.log('Received user details:', data);

      if (data.role === 'TENANT') {
        localStorage.setItem('tenantId', data.tenantId);
        localStorage.removeItem('landlordId');
        setTenantId(data.tenantId);
      } else if (data.role === 'LANDLORD') {
        localStorage.setItem('landlordId', data.landlordId);
        localStorage.removeItem('tenantId');
        setLandlordId(data.landlordId);
      }
    });

    return () => {
      socket.off('userDetails');
    };
  }, []);

  const updateSidebarLinks = (role: string) => {
    if (role === 'admin') {
      setSidebarLinks([
        { name: 'Home', icon: FiHome },
        { name: 'Properties', icon: FiKey },
        { name: 'Messages', icon: FiMessageSquare },
        { name: 'Users', icon: FiList },
        { name: 'Settings', icon: FiSettings },
      ]);
    } else {
      setSidebarLinks([
        { name: 'Home', icon: FiHome },
        { name: 'Properties', icon: FiKey },
        { name: 'Messages', icon: FiMessageSquare },
      ]);
    }
  };

  return (
    <UserContext.Provider
      value={{
        username,
        setUsername,
        users,
        userRole,
        sidebarLinks,
        token,
        userId,
        conversationId,
        setConversationId,
        tenantId,
        landlordId,
        notifications,
        refreshAccessToken, // Provide the refresh function
        isTokenExpired
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
