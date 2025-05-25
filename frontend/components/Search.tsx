'use client';
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { FaSearch } from 'react-icons/fa';
import CustomLoading from "./Loading";
import Chatbox from './Chatbox'; // Assuming Chatbox is the modal for the chat
import Search from '../components/Search';
import { useUser } from '../context/UserContext'; 
interface Property {
    id: number;
    title: string;
    description?: string;
    city: string;
    price: number;
    bedrooms: number;
    bathrooms: number;
    media: {
        type: string;
        url: string;
    }[];
    landlordId: number;
    liveEnabled?: boolean;
    liveTitle?: string;
    liveDate?: string;
    liveDuration?: string;
}

const Searchlist: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isChatboxOpen, setIsChatboxOpen] = useState(false);
    const [selectedLandlordId, setSelectedLandlordId] = useState<number | null>(null);
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null); // assuming conversationId for chat
    const [imageLoading, setImageLoading] = useState<Record<number, boolean>>({});
    const [isModalOpen, setIsModalOpen] = useState(false); // Correct implementation of state
    const [currentVideo, setCurrentVideo] = useState('');  // Correct implementation of state
    const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
    const { userId, tenantId, token, refreshAccessToken, isTokenExpired} = useUser();
    const [isChatLoading, setIsChatLoading] = useState(false);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4002";
    const router = useRouter();
     
    
     useEffect(() => {
        const token = localStorage.getItem("token");

        const fetchProperties = async () => {
            setLoading(true);
            setError(null);
            try {
                if (!token) throw new Error("No authentication token found.");

                const filters = parseSearchQuery(searchQuery);
                const response = await axios.get<Property[]>(`${apiUrl}/api/search`, {
                    params: filters,
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!Array.isArray(response.data)) throw new Error("Unexpected response format");

                const propertiesWithMedia = response.data.filter((p) => p.media.length > 0);
                const uniqueProperties = propertiesWithMedia.filter(
                    (p, index, self) => index === self.findIndex((q) => q.id === p.id)
                );

                setProperties(uniqueProperties);
            } catch (error: any) {
                console.error("Error fetching properties:", error);
                setError(error.message || "An unexpected error occurred.");
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(() => {
            if (searchQuery) fetchProperties();
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchQuery, apiUrl]);

   
     // ====================== handleTenantClick ======================
    const handleTenantClick = async (landlordId: string, propertyId: number) => {
    setSelectedLandlordId(Number(landlordId));
    setSelectedPropertyId(propertyId);  // you can still set it here if needed
    setIsChatLoading(true);
    setIsChatboxOpen(true);

    const fetchConversation = async () => {
        if (!tenantId || !landlordId || !propertyId) {
            console.warn('Missing info', { tenantId, landlordId, propertyId });
            setIsChatLoading(false);
            return;
        }

        let validToken = localStorage.getItem('token');
        if (!validToken || isTokenExpired(validToken)) {
            validToken = await refreshAccessToken();
            if (!validToken) {
                console.warn("Unable to refresh token.");
                setIsChatLoading(false);
                return;
            }
        }

        try {
            const conversationResponse = await axios.get(`${apiUrl}/api/chats`, {
                params: { landlordId, tenantId, propertyId, _t: Date.now() },
                headers: { Authorization: `Bearer ${validToken}`, 'Cache-Control': 'no-cache' },
            });

            const fetchedConversationId = conversationResponse.data.conversationId;
            if (fetchedConversationId) {
                setSelectedConversationId(fetchedConversationId);
            }
        } catch (error: any) {
            if (error.response?.status === 404) {
                try {
                    const startChatResponse = await axios.post(`${apiUrl}/api/chats/start-chat`, {
                        tenantId,
                        landlordId,
                        propertyId,
                    }, {
                        headers: { Authorization: `Bearer ${validToken}` },
                    });

                    const newConversationId = startChatResponse.data.conversationId;
                    if (newConversationId) {
                        setSelectedConversationId(newConversationId);
                    }
                } catch (startChatError) {
                    console.error('Error creating conversation:', startChatError);
                }
            } else {
                console.error('Error fetching conversation:', error);
            }
        } finally {
            setIsChatLoading(false);
        }
    };

    await fetchConversation();
};

    // ====================== parseSearchQuery ======================
    const parseSearchQuery = (query: string) => {
        const filters: {
            location: string;
            minPrice: string;
            maxPrice: string;
            bedrooms: string;
            bathrooms: string;
        } = {
            location: "",
            minPrice: "",
            maxPrice: "",
            bedrooms: "",
            bathrooms: ""
        };

        const queryParts = query.split(" ").filter(Boolean);
        queryParts.forEach(part => {
            const [key, value] = part.split(":");
            if (key && value && (key in filters)) {
                filters[key as keyof typeof filters] = value;
            } else {
                filters.location = part;
            }
        });

        return filters;
    };

    const closeModal = () => {
        setIsChatboxOpen(false);
        setSelectedLandlordId(null);
        setSelectedConversationId(null);
        setCurrentVideo('');
    };

    const handleImageLoad = (imageId: number) => {
    setImageLoading((prev) => ({ ...prev, [imageId]: false }));
  };

  const handleImageError = (imageId: number) => {
    setImageLoading((prev) => ({ ...prev, [imageId]: false }));
  };

const openModal = (videoUrl: string, landlordId: number, propertyId: number) => {
  setCurrentVideo(videoUrl);
  setIsModalOpen(true);
  setSelectedLandlordId(landlordId);
  setSelectedPropertyId(propertyId); // 🟢 Add this line
};

// Function to render media based on type (image or video)
const renderMedia = (
  media: { url: any; type: any },
  key: React.Key,
  propertyId: number,
  landlordId: number,
  property: Property // <-- pass the full property object
) => {
  const fileType = media.type.split("/")[0];

  if (fileType === "video") {
    return (
      <video
        key={key}
        src={media.url}
        className="w-full h-48 object-cover"
        muted
        playsInline
        onMouseEnter={(e) => e.currentTarget.play()}
        onMouseLeave={(e) => e.currentTarget.pause()}
        onClick={() => openModal(media.url, property.landlordId, property.id)}
        onError={(e) => console.error("Error loading video:", e)}
      >
        Your browser does not support the video tag.
      </video>
    );
  }

  if (fileType === "image") {
    return (
      <img
        key={key}
        src={media.url}
        alt="Property preview"
        className="w-full h-48 object-cover"
        onError={() => handleImageError(property.id)}
      />
    );
  }

  return null;
};


return (
  <div className="h-screen relative flex flex-col justify-center py-10 w-full dark:bg-black-100 bg-white bg-grid-black/[0.07] items-center">
    
    {/* 🔍 Search Input */}
    <div className="w-full lg:w-1/2 flex justify-center items-center">
      <div className="fixed px-3 lg:pl-0 z-10 w-full max-w-md lg:max-w-[36rem]">
        <label htmlFor="search" className="sr-only">Find a landlord</label>
        <input
          id="search"
          className="block border-gray-600 w-full max-w-md lg:max-w-[36rem] h-12 rounded-xl border border-1 bg-[linear-gradient(110deg,#000103,45%,#1e2631,55%,#000103)] bg-[length:200%_100%] px-6 py-2 font-medium text-slate-400 transition-colors animate-shimmer outline-none outline-2 placeholder:text-gray-600 placeholder:text-base"
          placeholder="ikorodu lagos."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <FaSearch className="absolute top-1/2 right-[3rem] transform -translate-y-1/2 h-[18px] w-5 text-slate-400 peer-focus:text-gray-900 cursor-pointer" />
      </div>
    </div>

    {/* 📋 Property List */}
   <div className="flex-grow w-full max-w-4xl mx-auto overflow-y-auto px-4 pt-[120px]">

      {loading ? (
        <CustomLoading />
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <>
          <div className="px-2 mb-6">
            <h1 className="text-lg font-bold">Available Properties</h1>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-2">
            {properties.length > 0 ? (
              properties.map((property) => {
                const uniqueMedia = [...new Map(property.media.map(item => [item.url, item])).values()];
                const previewMedia = uniqueMedia.slice(0, 1);
                const isLive =
                  property.liveEnabled &&
                  property.liveDate &&
                  Date.now() < new Date(property.liveDate).getTime() + (parseInt(property.liveDuration || '0') * 60000);

                return (
                  <div
                    className="relative bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-lg group hover:shadow-2xl transition-shadow duration-300 cursor-pointer"
                    key={property.id}
                    onClick={() => {
                      setCurrentVideo(
                        uniqueMedia.find(item => item.type === 'video')?.url || ''
                      );
                      setSelectedLandlordId(property.landlordId);
                      setSelectedPropertyId(property.id);
                      setIsModalOpen(true);
                    }}
                  >
                    {previewMedia.map((media, i) => (
                      <div key={i}>
                        {renderMedia(media, i, property.id, property.landlordId, property)}
                      </div>
                    ))}

                    <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white px-4 py-3 text-sm">
                      <p className="font-semibold truncate">{property.city}</p>
                      <p className="text-xs">
                        ₦{property.price.toLocaleString()}k · {property.bedrooms} bed / {property.bathrooms} bath
                      </p>
                    </div>

                    {isLive && (
                      <span className="absolute top-2 right-2 bg-red-600 text-white text-[10px] px-2 py-1 rounded-full animate-pulse shadow-md z-10">
                        LIVE
                      </span>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-sm">Search for properties in a preferred location</p>
            )}
          </div>
        </>
      )}
    </div>

    {/* 🎬 Video Modal */}
    {isModalOpen && currentVideo && (
      <div
        className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50"
        onClick={closeModal}
      >
        <div
          className="relative flex flex-col items-center"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="absolute top-2 right-2 text-white bg-black bg-opacity-50 px-3 py-1 rounded"
            onClick={closeModal}
          >
            ✕
          </button>

          <video
            src={currentVideo}
            className="w-full h-auto sm:w-96 md:w-[80%] lg:w-[60%] rounded-md"
            autoPlay
            controls
          />

          <div className="mt-4 w-full flex flex-row justify-between items-start sm:items-center gap-4 px-4 text-white text-sm">
            <div className="space-y-1">
              <p>Location: {properties.find(p => p.id === selectedPropertyId)?.city}</p>
              <p>Price: ₦{properties.find(p => p.id === selectedPropertyId)?.price.toLocaleString()}k</p>
              <p>Bedrooms: {properties.find(p => p.id === selectedPropertyId)?.bedrooms}</p>
              <p>Bathrooms: {properties.find(p => p.id === selectedPropertyId)?.bathrooms}</p>
            </div>

            {selectedLandlordId && selectedPropertyId && (
              <div className="flex-shrink-0 mt-4">
                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded"
                  onClick={() => handleTenantClick(selectedLandlordId.toString(), selectedPropertyId)}
                >
                  Chat Landlord Manager
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )}

    {/* 💬 Fullscreen Chat Modal (Mobile-friendly) */}
    {isChatboxOpen && selectedLandlordId && (
      <div className="fixed inset-0 bg-white dark:bg-black z-50 flex flex-col p-4">
        <div className="flex justify-between items-center border-b pb-2 mb-4">
          <h2 className="text-lg font-semibold">Chat</h2>
          <button onClick={closeModal} className="text-2xl leading-none">✕</button>
        </div>

        {isChatLoading ? (
          <div className="flex flex-col items-center justify-center flex-grow">
            <p className="text-gray-600 mb-4">Connecting to landlord...</p>
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : selectedConversationId ? (
          <Chatbox
            landlordId={selectedLandlordId.toString()}
            conversationId={selectedConversationId}
          />
        ) : (
          <p className="text-center text-gray-400 flex-grow flex items-center justify-center">No conversation started.</p>
        )}
      </div>
    )}
  </div>
);
}
export default Searchlist;
