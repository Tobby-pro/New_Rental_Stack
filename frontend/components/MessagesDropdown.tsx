import { useState, useCallback, useRef, useEffect } from 'react';
import Chatbox from './Chatbox';
import { motion, AnimatePresence } from 'framer-motion';

interface TenantMessage {
  conversationId: string;
  name: string;
  lastMessage: string;
  lastMessageDate: string;
}

interface MessageDropdownProps {
  tenantMessages: TenantMessage[];
  landlordId: string | null;
  onTenantClick: (tenantId: string, conversationId: string) => void;
  onMarkAsRead: (conversationId: string) => Promise<void>;
  newMessageCount: number;
  onChatToggle?: (isOpen: boolean) => void; // ✅ Optional new prop
}

const MessageDropdown = ({
  tenantMessages,
  landlordId,
  onTenantClick,
  onMarkAsRead,
  newMessageCount,
  onChatToggle,
}: MessageDropdownProps) => {

  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
 

  const chatboxRef = useRef<HTMLDivElement | null>(null);
  const backdropRef = useRef<HTMLDivElement | null>(null);

  const handleTenantClick = useCallback((tenantId: string, conversationId: string) => {
    setSelectedTenant(tenantId);
    setSelectedConversationId(conversationId);

    setTimeout(() => {
      onTenantClick(tenantId, conversationId);
      onMarkAsRead(conversationId);
      if (onChatToggle) {
        onChatToggle(true); // Only opens the sidebar chat panel
      }
    }, 0);
  }, [onTenantClick, onMarkAsRead, onChatToggle]);


  const closeModal = () => {
    setSelectedTenant(null);
    setSelectedConversationId(null);

    // ✅ Notify parent that chat is closed
    if (onChatToggle) {
      onChatToggle(false);
    }
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (
      backdropRef.current && !backdropRef.current.contains(event.target as Node) &&
      chatboxRef.current && !chatboxRef.current.contains(event.target as Node)
    ) {
      closeModal();
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const formatDate = (date: string) => {
    const dateObj = new Date(date);
    return dateObj.toLocaleString();
  };

  return (
    <div className="relative">
      <AnimatePresence>
        {tenantMessages.length > 0 && (
          <motion.div
            key="dropdown"
            className="absolute top-10 right-[-30px] w-96 max-h-96 overflow-y-auto bg-white rounded-2xl shadow-2xl z-50 border border-gray-200"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {tenantMessages.map(({ conversationId, name, lastMessage, lastMessageDate }) => (
              <div
                key={conversationId}
                className="p-4 border-b last:border-b-0 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => handleTenantClick(name, conversationId)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-blue-700 truncate">{name}</div>
                      <div className="text-xs text-gray-400 whitespace-nowrap">{formatDate(lastMessageDate)}</div>
                    </div>
                    <div className="text-sm text-gray-500 truncate">{lastMessage}</div>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MessageDropdown;
