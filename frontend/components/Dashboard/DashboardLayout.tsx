import React, { ReactElement, useState, cloneElement, isValidElement } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import AddPropertyModal from '../AddProperty';
import Notification from '../Notification';
import ChatPanel from './ChatPanel';
import '@/styles/globals.css';
import { useUser } from '@/context/UserContext';
import axios, { AxiosError } from 'axios';

interface DashboardLayoutProps {
  children: ReactElement; // No prop typing here, keep flexible
}

interface ErrorResponse {
  message: string;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [currentView, setCurrentView] = useState('Dashboard');
  const [modalOpen, setModalOpenState] = useState(false);
  const { username, userId, conversationId, landlordId, refreshAccessToken, isTokenExpired } = useUser();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002';

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const handleLinkClick = (view: string) => {
    setCurrentView(view);
    setSidebarOpen(false);
  };

  const onChatToggle = () => {
    setChatOpen(prev => !prev);
  };

  const handleCloseNotification = () => setAlertMessage(null);

  const handleAddPropertySubmit = async (formData: any) => {
    try {
      setIsSubmitting(true);
      setError(null);

      let validToken = localStorage.getItem('token');
      if (!validToken || isTokenExpired(validToken)) {
        validToken = await refreshAccessToken();
        if (!validToken) {
          setError("Session expired. Please log in again.");
          return;
        }
      }

      const response = await axios.post(`${apiUrl}/api/properties`, formData, {
        headers: {
          Authorization: `Bearer ${validToken}`,
        },
      });

      setAlertMessage('Property added successfully!');
      setModalOpenState(false);
    } catch (err) {
      const axiosError = err as AxiosError<ErrorResponse>;
      setError(axiosError.response?.data.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // IMPORTANT: Type assertion here to silence TypeScript error
  const enhancedChildren = isValidElement(children)
    ? cloneElement(children as ReactElement<any>, { setModalOpen: setModalOpenState })
    : children;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white">
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-70 backdrop-blur-sm md:hidden">
          <Sidebar isMobile={true} onClose={toggleSidebar} onLinkClick={handleLinkClick} setModalOpen={setModalOpenState} onChatToggle={onChatToggle} />
        </div>
      )}

      <div className="flex flex-1 flex-col md:flex-row w-full">
        <aside className="hidden md:block md:w-64 border-r border-gray-800 bg-gray-950">
          <Sidebar onClose={() => setSidebarOpen(false)} isMobile={false} onLinkClick={handleLinkClick} setModalOpen={setModalOpenState} onChatToggle={onChatToggle} />
        </aside>

        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          <Topbar
            className="fixed top-0 z-50 w-full h-16 bg-white text-black"
            username={username || 'Landlord'}
            onSidebarToggle={toggleSidebar}
            currentView={currentView}
            hasNewNotification={hasNewNotification}
            notifications={notifications}
            landlordId={landlordId}
            conversationId={conversationId || ''}
            socket={undefined}
            onChatToggle={() => setChatOpen(prev => !prev)}
            onLinkClick={handleLinkClick}
            setModalOpen={setModalOpenState}
          />

          <div className="flex-1 overflow-y-auto pt-16 p-4 sm:p-6">
            <main className="flex-1">
              {enhancedChildren}

              <AddPropertyModal
                isOpen={modalOpen}
                onClose={() => setModalOpenState(false)}
                isSubmitting={isSubmitting}
                error={error}
                setAlertMessage={setAlertMessage}
                onSubmit={handleAddPropertySubmit}
              />
            </main>
          </div>
        </div>
      </div>

      <ChatPanel isOpen={chatOpen} onClose={() => setChatOpen(false)} />
      <Notification message={alertMessage} onClose={handleCloseNotification} />
    </div>
  );
};

export default DashboardLayout;