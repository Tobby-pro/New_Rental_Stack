import { useState, useEffect, useRef } from 'react';
import { useUser } from '../context/UserContext'; // Importing user context
import axios from 'axios';
import io, { Socket } from 'socket.io-client';

interface Message {
    conversationId: string;
    senderProfilePictureUrl?: string;
    id: string;
    senderId: number;
    senderName: string;
    message: string;
    messageType: string;
    status: string;
    timestamp: string;
}
interface TypingData {
    conversationId: string;
    userId: string;
}
interface ChatBoxProps {
    landlordId: string;
    conversationId: string | null;
}

const ChatBox: React.FC<ChatBoxProps> = ({ landlordId, conversationId: initialConversationId }) => {
    const { userId, tenantId, token, refreshAccessToken, isTokenExpired} = useUser(); // Getting tenantId directly from context
    const [landlord, setLandlord] = useState<any>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState<string>('');
    const [socket, setSocket] = useState<Socket | null>(null);
    const [seenMessages, setSeenMessages] = useState<string[]>([]); // Track seen messages
    const [conversationId, setConversationId] = useState<string>(initialConversationId || '');
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    const [isTyping, setIsTyping] = useState<boolean>(false);
    let typingTimeout: NodeJS.Timeout;
   
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002';
    const parsedLandlordId = landlordId ? parseInt(landlordId, 10) : null;

    const conversationIdRef = useRef(conversationId);

       const handleTyping = () => {
        if (socket) {
            socket.emit('typing', { conversationId, userId: 'userId' }); // Emit typing event
        }
        setIsTyping(true);

        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
            setIsTyping(false);
        }, 2000); // Hide typing indicator after 2 seconds
    };

    useEffect(() => {
        const typingListener = (data: TypingData) => {
            if (data.conversationId === conversationId) {
                setIsTyping(true);
                clearTimeout(typingTimeout);
                typingTimeout = setTimeout(() => setIsTyping(false), 2000);
            }
        };

        socket?.on('typing', typingListener);

        return () => {
            socket?.off('typing', typingListener);
        };
    }, [conversationId, socket]);


    useEffect(() => {
  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
}, [messages]);

    // Log useUser values after update
    useEffect(() => {
        console.log("Updated useUser values:", { userId, tenantId });
    }, [userId, tenantId]);

    useEffect(() => {
        conversationIdRef.current = conversationId;
    }, [conversationId]);

    useEffect(() => {
        if (initialConversationId && !conversationId) {
            setConversationId(initialConversationId);
        }
    }, [initialConversationId, conversationId]);

    // Fetch landlord information
    useEffect(() => {
        const fetchLandlordInfo = async () => {
            if (!parsedLandlordId) return;

            let validToken = token;

            // Check if token is missing or expired, then try to refresh it
            if (!validToken || isTokenExpired(validToken)) {
                validToken = await refreshAccessToken(); // This now returns string | null ✅
                if (!validToken) {
                    console.error("Unable to refresh token.");
                    return;
                }
            }

            try {
                const response = await axios.get(`${apiUrl}/api/landlords/${parsedLandlordId}`, {
                    headers: { Authorization: `Bearer ${validToken}` }, // Use validToken here
                });
                setLandlord(response.data);
            } catch (error: any) {
                console.error('Error fetching landlord info:', error);
            }
        };
        fetchLandlordInfo();
    }, [parsedLandlordId, apiUrl, token, refreshAccessToken, isTokenExpired]);

    useEffect(() => {
    const fetchConversation = async () => {
        if (!tenantId || !parsedLandlordId || conversationId) return; // Prevent overwriting existing ID
        
        let validToken = localStorage.getItem('token');
        if (!validToken || isTokenExpired(validToken)) {
            validToken = await refreshAccessToken(); // This now returns string | null ✅
            if (!validToken) {
                console.warn("Unable to refresh token. User might not be authenticated.");
                return;
            }
        }

        try {
            console.log("Fetching conversation with:", { landlordId: parsedLandlordId, tenantId });
            const conversationResponse = await axios.get(`${apiUrl}/api/chats`, {
                params: { landlordId: parsedLandlordId, tenantId, _t: Date.now() },
                headers: { Authorization: `Bearer ${validToken}`, 'Cache-Control': 'no-cache' }, // Use validToken here
            });

            const fetchedConversationId = conversationResponse.data.conversationId;
            if (!conversationIdRef.current) {
                setConversationId(fetchedConversationId);
            }
        } catch (error: any) {
            if (error.response?.status === 403) {
                console.error('Access denied. Please check authentication.');
            } else if (error.response?.status === 404) {
                console.log('No existing conversation found. Creating one...');
                const propertyId = landlord?.listings?.[0]?.id;
                if (!propertyId) return;

                try {
                    const startChatResponse = await axios.post(`${apiUrl}/api/chats/start-chat`, {
                        tenantId, // Now using tenantId from context
                        landlordId: parsedLandlordId,
                        propertyId
                    }, {
                        headers: { Authorization: `Bearer ${validToken}` }, // Use validToken here
                    });

                    const newConversationId = startChatResponse.data.conversationId;
                    console.log("Newly created conversationId:", newConversationId);
                    if (!conversationIdRef.current) {
                        setConversationId(newConversationId);
                    }
                } catch (startChatError: any) {
                    console.error('Error creating conversation:', startChatError);
                }
            } else {
                console.error('Error fetching or creating conversation:', error);
            }
        }
    };

    fetchConversation();
}, [tenantId, parsedLandlordId, apiUrl, token, refreshAccessToken, isTokenExpired]);


    useEffect(() => {
        if (conversationId) {
            loadConversationMessages(conversationId);
        }
    }, [conversationId]);

    const loadConversationMessages = async (conversationId: string) => {
    if (!conversationId) return;

    let validToken = localStorage.getItem('token');
    if (!validToken || isTokenExpired(validToken)) {
        validToken = await refreshAccessToken(); // This now returns string | null ✅
        if (!validToken) {
            console.warn("Unable to refresh token. User might not be authenticated.");
            return;
        }
    }

    try {
        console.log("Fetching messages for conversationId:", conversationId);
        const response = await axios.get(`${apiUrl}/api/messages/conversation/${conversationId}`, {
            headers: { Authorization: `Bearer ${validToken}` }, // Use validToken here
        });

        if (conversationIdRef.current === conversationId) {
            setMessages(response.data.reverse());
        }
    } catch (error) {
        console.error('Error loading conversation messages:', error);
    }
};

    useEffect(() => {
    if (!conversationId) return; // Don't initialize socket until conversationId is available

    const socketConnection = io(apiUrl!, { transports: ['websocket'] });
    setSocket(socketConnection);

    const messageListener = (message: Message) => {
        if (message.conversationId === conversationIdRef.current) {
            setMessages((prevMessages) => [...prevMessages, message]);
        }
    };

    socketConnection.on('message', messageListener);
    socketConnection.emit('joinRoom', conversationId); // Emit after socket is ready

    return () => {
        socketConnection.off('message', messageListener);
        socketConnection.disconnect();
    };
}, [apiUrl, conversationId]);  // Dependency on conversationId


  const sendMessage = async () => {
   

    if (!userId || !newMessage.trim() || !conversationId) {
        console.warn('Missing required fields.');
        return;
    }

    let validToken = localStorage.getItem('token');
    if (!validToken || isTokenExpired(validToken)) {
        validToken = await refreshAccessToken(); // This now returns string | null ✅
        if (!validToken) {
            console.warn("Unable to refresh token. User might not be authenticated.");
            return;
        }
    }

    try {
        // Send the message to the backend API
        await axios.post(`${apiUrl}/api/messages`, {
            conversationId,
            message: newMessage,
            messageType: 'text',
        }, {
            headers: { Authorization: `Bearer ${validToken}` }, // Use validToken here
        });

        // Manually add the new message to state with initial status as 'sent'
        const newMessageObj: Message = {
            conversationId,
            senderId: Number(userId),  // Ensure userId is a number
            senderName: "You",  // Replace with the actual name or context value
            message: newMessage,
            messageType: 'text',
            status: 'sent', // Initially mark as 'sent'
            timestamp: new Date().toISOString(),
            id: Date.now().toString()  // Use unique ID for the new message
        };

        // Update state immediately to show the message in the UI
        setMessages((prevMessages) => [...prevMessages, newMessageObj]);

        // Emit the message via socket to others in the chat (if socket is available)
        socket?.emit('send_message_to_room', conversationId, newMessageObj);

        // Reset the message input field
        setNewMessage('');

    } catch (error) {
        console.error('Error sending message:', error);
    }
};


useEffect(() => {
    socket?.on('message_delivered', (messageId) => {
        console.log('Message delivered:', messageId); // Add a log for debugging
        setMessages((prevMessages) =>
            prevMessages.map((msg) =>
                msg.id === messageId ? { ...msg, status: 'delivered' } : msg
            )
        );
    });

    socket?.on('message_seen', (messageId) => {
        console.log('Message seen:', messageId); // Add a log for debugging
        setMessages((prevMessages) =>
            prevMessages.map((msg) =>
                msg.id === messageId ? { ...msg, status: 'seen' } : msg
            )
        );
    });

    return () => {
        socket?.off('message_delivered');
        socket?.off('message_seen');
    };
}, []);  // Empty dependency array ensures this runs only once

const formatDateHeader = (timestamp: string): string => {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (d1: Date, d2: Date) =>
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear();

  if (sameDay(date, today)) return 'Today';
  if (sameDay(date, yesterday)) return 'Yesterday';

  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
};



    const formatTime = (timestamp: string | Date) => {
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };
 let lastRenderedDate: string | null = null;

 
 return (
    <div className="flex flex-col h-[90vh] max-w-md mx-auto shadow-md border rounded-lg overflow-hidden bg-white">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => {
                const isOwnMessage = msg.senderId === Number(userId);
                const isSeen = isOwnMessage && seenMessages.includes(msg.id);

                const msgDate = new Date(msg.timestamp).toDateString();
                const shouldRenderDateHeader = lastRenderedDate !== msgDate;
                if (shouldRenderDateHeader) lastRenderedDate = msgDate;

                return (
                    <div key={msg.id}>
                        {shouldRenderDateHeader && (
                            <div className="flex justify-center my-2">
                                <span className="text-xs text-gray-600 bg-gray-200 px-4 py-1 rounded-full shadow-sm">
                                    {formatDateHeader(msg.timestamp)}
                                </span>
                            </div>
                        )}
                        <div
                            className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm shadow-sm transition-all duration-200 ease-in-out transform ${
                                isOwnMessage
                                    ? 'bg-blue-500 text-white self-end ml-auto'
                                    : 'bg-gray-200 text-black self-start mr-auto'
                            }`}
                        >
                            <div>{msg.message}</div>
                            <div className="text-[10px] text-right mt-1 flex justify-end items-center gap-1">
                                <span>{formatTime(msg.timestamp)}</span>
                                {msg.status === 'delivered' && !isSeen && (
                                    <span className="text-yellow-400 font-bold">✓</span>
                                )}
                                {isSeen && (
                                    <span className="text-green-400 font-bold">✓✓</span>
                                )}
                                {msg.status === 'sent' && !isSeen && (
                                    <span className="text-gray-400 font-bold">{isOwnMessage ? '⏳' : '✓'}</span>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}

            {isTyping && (
                <div className="text-gray-500 text-xs italic">typing...</div>
            )}
            <div ref={messagesEndRef} />
        </div>

        <div className="flex items-center gap-2 p-3 border-t">
            <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyUp={handleTyping}
                placeholder="Type a message..."
                className="text-black flex-1 px-4 py-2 rounded-full border bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
                onClick={sendMessage}
                className="bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600"
            >
                Send
            </button>
        </div>
    </div>
);

};

export default ChatBox;
