import React, { ReactNode, useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import AddPropertyModal from '../AddProperty'; // Import modal component
import Notification from '../Notification'; // Import Notification component
import '@/styles/globals.css';
import { useUser } from '@/context/UserContext';
import axios, { AxiosError } from 'axios'; // Import axios and AxiosError
import { uploadMedia } from "../utils/firebaseStorage"; 
interface PropertyType {
  id: string;
  address: string;
  city: string;
  state: string;
  price: number;
  // Add additional fields as needed
}

interface DashboardLayoutProps {
  children: ReactNode;
  setModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

interface ErrorResponse {
  message: string;
  // Add additional API response fields as needed
}

const DashboardLayout = ({ children, setModalOpen }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState('Dashboard');
  const [modalOpen, setModalOpenState] = useState(false); // State for modal visibility
  const { username, userId, conversationId, landlordId, refreshAccessToken, isTokenExpired, tenantId } = useUser(); // Retrieve userId and conversationId from context
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null); // Error state
  const [alertMessage, setAlertMessage] = useState<string | null>(null); // Alert message state
  const [hasNewNotification, setHasNewNotification] = useState(false); // Notification state for the green dot
  const [notifications, setNotifications] = useState<string[]>([]); // State for notifications
  const [properties, setProperties] = useState<PropertyType[]>([]); // State for properties

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleLinkClick = (view: string) => {
    setCurrentView(view);
    setSidebarOpen(false);
  };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002'; // API URL

  // Effect to get landlordId and tenantId from localStorage

  // Form submission function
const handleSubmit = async (formData: FormData) => {
  // Validate required fields
  if (
    !formData.get('address') ||
    !formData.get('city') ||
    !formData.get('state') ||
    !formData.get('price') ||
    formData.getAll('media').length === 0
  ) {
    setError('All fields, including media (images or videos), are required.');
    return;
  }

  setIsSubmitting(true);
  setError(null); // Clear any previous error

  try {
    let validToken = localStorage.getItem('token');

    // ⛽ Token expired? Try refreshing
    if (!validToken || isTokenExpired(validToken)) {
      validToken = await refreshAccessToken();
      if (!validToken) {
        throw new Error('Authentication failed. Please log in again.');
      }
    }

    const response = await axios.post(`${apiUrl}/api/properties`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${validToken}`,
      },
    });

    const { landlordId } = response.data;
    localStorage.setItem('landlordId', landlordId);
    setAlertMessage('Property added successfully!');
    setModalOpenState(false);
  } catch (err: any) {
    const axiosError = err as AxiosError<ErrorResponse>;
    if (axiosError.response) {
      setError(axiosError.response.data.message || 'An error occurred. Please try again.');
    } else {
      setError(err.message || 'An error occurred. Please try again.');
    }
    setModalOpenState(true);
  } finally {
    setIsSubmitting(false);
  }
};



  const handleCloseNotification = () => setAlertMessage(null); // Close notification

  return (
    <div className=" flex sm:flex-col sm:min-h-screen">
      {sidebarOpen && (
        <div
          className="fixed bottom-0 inset-0 z-40 transform transition-transform duration-300 ease-in-out md:hidden"
          style={{ overflowY: 'hidden', height: '100vh' }}
        >
          <Sidebar onClose={toggleSidebar} onLinkClick={handleLinkClick} setModalOpen={setModalOpenState} />
        </div>
      )}

      <div className="z-30 flex-1 flex flex-col md:flex-row">
        {/* Sidebar for larger screens */}
        <div className="hidden md:block w-64 border-r border-gray-300">
          <Sidebar onClose={() => setSidebarOpen(false)} onLinkClick={handleLinkClick} setModalOpen={setModalOpenState} />
        </div>

        <div className="flex-1 flex flex-col border-r border-gray-300 p-4 sm:p-6 overflow-y-auto md:overflow-y-auto">
          <Topbar
            username={username || 'Landlord'}
            onSidebarToggle={toggleSidebar}
            currentView={currentView}
            hasNewNotification={hasNewNotification}
            notifications={notifications}
            landlordId={landlordId}
            // tenantId={tenantId}
            conversationId={conversationId || ''} socket={undefined}          />

          <main className="flex-1 sm:min-h-screen overflow-y-auto">
            {children}
            <AddPropertyModal
              isOpen={modalOpen}
              onClose={() => setModalOpenState(false)}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              error={error}
              setAlertMessage={setAlertMessage}
/>
          </main>
        </div>

        {/* Right section */}
        <div className="hidden md:block w-72 p-4 border-l border-gray-300">
          <div
            className="h-full rounded-lg shadow-md p-4"
            style={{
              height: '100vh',
              overflowY: 'hidden',
              background: 'rgb(5,8,42)',
              backgroundImage:
                "linear-gradient(34deg, rgba(5,8,42,1) 14%, rgba(8,8,28,1) 50%, rgba(3,5,24,1) 64%, rgba(74,39,150,1) 75%, rgba(15,20,62,1) 84%, rgba(12,4,18,1) 91%, rgba(0,0,1,1) 100%, rgba(21,18,94,1) 100%, rgba(15,29,55,1) 100%)",
            }}
          >
            {/* Render ChatComponent here */}
          </div>
        </div>
      </div>

      {/* Notification component */}
      <Notification message={alertMessage} onClose={handleCloseNotification} />
    </div>
  );
};

export default DashboardLayout;
