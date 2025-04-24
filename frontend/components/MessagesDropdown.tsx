import { useState, useCallback } from 'react';
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
}

const MessageDropdown = ({ tenantMessages, landlordId, onTenantClick }: MessageDropdownProps) => {
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [isChatboxOpen, setIsChatboxOpen] = useState(false);

  const handleTenantClick = useCallback((tenantId: string, conversationId: string) => {
    setSelectedTenant(tenantId);
    setSelectedConversationId(conversationId);
    
    setTimeout(() => {
      setIsChatboxOpen(true);
      onTenantClick(tenantId, conversationId);
    }, 0);
  }, [onTenantClick]);

  const closeModal = () => {
    setIsChatboxOpen(false);
    setSelectedTenant(null);
    setSelectedConversationId(null);
  };

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
                  {/* Avatar bubble with initial */}
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {name[0]}
                  </div>

                  {/* Message content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <div className=" text-sm text-blue-700 truncate">{name}</div>
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

      {/* Modal Chatbox */}
      <AnimatePresence>
        {isChatboxOpen && selectedTenant && selectedConversationId && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-lg w-full max-w-md p-4 relative shadow-xl"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <button
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                onClick={closeModal}
              >
                ✕
              </button>
              <Chatbox
                key={selectedConversationId}
                landlordId={landlordId || ''}
                conversationId={selectedConversationId}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MessageDropdown;
