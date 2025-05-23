import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useUser } from '@/context/UserContext';
import io from 'socket.io-client';

interface ChatMessage {
id: string;
senderId: number;
senderName: string;
message: string;
messageType: string;
timestamp: string;
status: string;
conversationId: string;
}

interface Conversation {
conversationId: string;
name: string;
chat: ChatMessage[];
lastMessage: string;
lastMessageDate: string;
read: boolean;
}

interface ChatPanelProps {
isOpen: boolean;
onClose: () => void;
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4002";

const ChatPanel = ({ isOpen, onClose }: ChatPanelProps) => {
const [messages, setMessages] = useState<Conversation[]>([]);
const [activeChatId, setActiveChatId] = useState<string | null>(null);
const [input, setInput] = useState<string>("");
const chatPanelRef = useRef<HTMLDivElement>(null);

const { userId, username, landlordId, tenantId, token, userRole, refreshAccessToken, isTokenExpired } = useUser();
const socketRef = useRef<any>(null);

useEffect(() => {
if (isOpen && !socketRef.current) {
socketRef.current = io(apiUrl);

   socketRef.current.on("connect", () => {
    console.log("Socket connected:", socketRef.current.id);
  });

  socketRef.current.on("receive_message", (incomingMessage: ChatMessage) => {
    setMessages(prevMessages =>
      prevMessages.map(conv =>
        conv.conversationId === incomingMessage.conversationId
          ? { ...conv, chat: [...conv.chat, incomingMessage] }
          : conv
      )
    );
  });

  socketRef.current.on("disconnect", () => {
    console.log("Socket disconnected");
  });
}

return () => {
  socketRef.current?.disconnect();
  socketRef.current = null;
};
  }, [isOpen]);

  const fetchMessages = async () => {
    try {
      let validToken = token;
      if (!validToken || isTokenExpired(validToken)) {
        validToken = await refreshAccessToken();
        if (!validToken) {
          console.error("Unable to refresh token.");
          return;
        }
      }

      let endpoint = "";
      if (userRole?.toLowerCase() === "landlord" && userId) {
        endpoint = `${apiUrl}/api/messages/landlord/${landlordId}/conversations`;
      } else if (userRole?.toLowerCase() === "tenant" && tenantId) {
        endpoint = `${apiUrl}/api/messages/tenant/${tenantId}/conversations`;
      } else {
        console.error("Invalid role or ID");
        return;
      }

      const response = await axios.get(endpoint, {
        headers: {
          Authorization: `Bearer ${validToken}`,
        },
      });

      const formatted = Object.entries(response.data).map(([conversationId, data]: any) => ({
        conversationId: String(conversationId),
        name: data.name || `User ${conversationId}`,
        lastMessage: data.lastMessage || "No messages yet",
        lastMessageDate: data.lastMessageDate || "Unknown",
        read: data.status === "READ",
        chat: data.chat || [],
      }));

      setMessages(formatted);
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    }
  };

  useEffect(() => {
    if (isOpen) fetchMessages();
  }, [isOpen, userId, tenantId, userRole]);

  const handleSelectChat = async (conversationId: string) => {
    if (activeChatId === conversationId) return;

    try {
      let validToken = token;
      if (!validToken || isTokenExpired(validToken)) {
        validToken = await refreshAccessToken();
        if (!validToken) {
          console.error("Unable to refresh token.");
          return;
        }
      }

      const res = await axios.get(`${apiUrl}/api/messages/conversation/${conversationId}`, {
        headers: {
          Authorization: `Bearer ${validToken}`,
        },
      });

      setMessages(prevMessages => prevMessages.map(conv =>
        conv.conversationId === String(conversationId) ? { ...conv, chat: res.data.reverse() } : conv
      ));
      setActiveChatId(String(conversationId));
      socketRef.current?.emit("join_room", conversationId);

    } catch (error) {
      console.error("Failed to fetch conversation:", error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !activeChatId || !userId) {
      console.warn("Missing required fields.");
      return;
    }

    let validToken = token;
    if (!validToken || isTokenExpired(validToken)) {
      validToken = await refreshAccessToken();
      if (!validToken) {
        console.error("Unable to refresh token.");
        return;
      }
    }

    const newMessageObj: ChatMessage = {
      conversationId: activeChatId,
      senderId: Number(userId),
      senderName: username ?? "You",
      message: input,
      messageType: 'text',
      timestamp: new Date().toISOString(),
      id: Date.now().toString(),
      status: 'sent',
    };

    try {
      await axios.post(`${apiUrl}/api/messages`, {
        conversationId: activeChatId,
        message: input,
        messageType: 'text',
      }, {
            headers: { Authorization: `Bearer ${validToken}` },
      });

      setMessages(prevMessages =>
        prevMessages.map(convo =>
          convo.conversationId === activeChatId
            ? {
                ...convo,
                chat: [...convo.chat, newMessageObj],
                lastMessage: newMessageObj.message,
                lastMessageDate: newMessageObj.timestamp,
                read: true,
              }
            : convo
        )
      );

      socketRef.current?.emit('send_message_to_room', activeChatId, newMessageObj);
      setInput('');
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (chatPanelRef.current && !chatPanelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const activeChat = messages.find(msg => String(msg.conversationId) === String(activeChatId));

 return (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        ref={chatPanelRef}
        className="w-full sm:w-[380px] fixed bottom-0 right-0 h-[90vh] bg-white shadow-xl border-t-2 border-gray-300 p-4 z-50 rounded-sm"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 text-2xl">×</button>

        {!activeChat ? (
          <div>
            <ul className="space-y-3">
              {messages.map(msg => (
                <li
                  key={msg.conversationId}
                  onClick={() => handleSelectChat(msg.conversationId)}
                  className="cursor-pointer p-3 border-b hover:bg-gray-100 rounded"
                >
                  <div className="font-semibold text-blue-700">{msg.name}</div>
                  <div className="text-sm text-gray-600">{msg.lastMessage}</div>
                  <div className="text-xs text-gray-400">{msg.lastMessageDate}</div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <button onClick={() => setActiveChatId(null)} className="text-blue-500 text-sm p-2">← Back to messages</button>
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3 rounded-t-lg mb-4">
              <h2 className="text-md font-semibold">Chat with {activeChat.name}</h2>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
              {activeChat.chat.length > 0 ? (
                activeChat.chat.map((message, index) => {
                  const isOwnMessage = message.senderId === Number(userId);
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`relative max-w-[75%] px-4 py-2 rounded-2xl shadow-md ${
                        isOwnMessage
                          ? "bg-blue-600 text-white rounded-br-none"
                          : "bg-gray-200 text-gray-800 rounded-bl-none"
                      }`}>
                        <p className="text-sm">{message.message}</p>
                        <div className="text-[10px] mt-1 opacity-70 text-right">
                          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className={`absolute bottom-0 ${
                          isOwnMessage ? "right-0 -mb-2 mr-2 border-l-[6px] border-l-blue-600" : "left-0 -mb-2 ml-2 border-r-[6px] border-r-gray-200"
                        } border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent`}></div>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <p className="text-center text-gray-400">No messages yet.</p>
              )}
            </div>
            <div className="p-2 border-t">
              <div className="flex items-center bg-gray-100 rounded-full px-3 py-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Type a message"
                  className="flex-1 text-black-200 bg-transparent focus:outline-none px-2 text-sm"
                />
                <button
                  onClick={handleSend}
                  className="text-white bg-blue-600 hover:bg-blue-700 px-4 py-1 text-sm rounded-full ml-2"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    )}
  </AnimatePresence>
);

};

export default ChatPanel;
