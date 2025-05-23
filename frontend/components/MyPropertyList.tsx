import React, { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import CustomLoading from './Loading';
import { useUser } from '@/context/UserContext';
import dynamic from 'next/dynamic';
import { Globe } from 'lucide-react';
import MuxPlayer from '@mux/mux-player-react';

const GoLiveForm = dynamic(() => import('./GoLiveForm'), { ssr: false });

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002';

interface Media {
  type: string;
  id: number;
  url: string;
  propertyId: number;
  createdAt: string;
  updatedAt: string;
  playbackId?: string;
  status?: string;
}

interface Property {
  id: number;
  address: string;
  city: string;
  state: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  landlordId: number;
  createdAt: string;
  media: Media[];
  description?: string;
}

interface MyPropertyListProps {
  className?: string;
}

const MyPropertyList: React.FC<MyPropertyListProps> = ({ className }) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState<Record<number, boolean>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPlaybackId, setCurrentPlaybackId] = useState('');
  const [showGoLiveModal, setShowGoLiveModal] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);

  const { token, refreshAccessToken, isTokenExpired } = useUser();

  const handleOpenGoLive = (property: { id: number; title: string }) => {
    setSelectedPropertyId(property.id);
    setShowGoLiveModal(true);
  };

  const handleCloseGoLive = () => {
    setShowGoLiveModal(false);
    setSelectedPropertyId(null);
  };

  const fetchProperties = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const landlordId = localStorage.getItem('landlordId');

      if (!token || !landlordId) {
        throw new Error('Missing authentication details');
      }

      const response = await axios.get<Property[]>(`${apiUrl}/api/landlord/properties`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setProperties(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const checkAndFetch = async () => {
      if (isTokenExpired(token)) {
        await refreshAccessToken();
      }

      const freshToken = localStorage.getItem('token');
      const landlordId = localStorage.getItem('landlordId');

      if (freshToken && landlordId) {
        fetchProperties();
      } else {
        setError('User not authorized');
        setLoading(false);
      }
    };

    checkAndFetch();
  }, [token, fetchProperties, isTokenExpired, refreshAccessToken]);

  const handleImageLoad = (imageId: number) => {
    setImageLoading((prev) => ({ ...prev, [imageId]: false }));
  };

  const handleImageError = (imageId: number) => {
    setImageLoading((prev) => ({ ...prev, [imageId]: false }));
  };

  const openModal = (playbackId: string) => {
    setCurrentPlaybackId(playbackId);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentPlaybackId('');
  };

  if (loading) return <CustomLoading />;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className={`p-6 ${className}`}>
      <h1 className="text-left text-sm font-semibold mb-6">Properties Created by You</h1>

      {properties.length === 0 ? (
        <p className="text-gray-500 text-sm">You have no properties yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
          {properties.map((property) => {
            const media = property.media[0];
            const isVideoReady = media?.type === 'video' && media.status === 'ready';
            const playbackId = media?.playbackId;

            return (
              <div
                key={property.id}
                className="relative max-w-sm bg-white dark:bg-[#0f0f0f] dark:border-gray-500 rounded-xl overflow-hidden shadow-lg group hover:shadow-2xl hover:scale-[1.03] transition-transform duration-300 cursor-pointer"
              >
                {isVideoReady && (
                  <div className="absolute top-2 right-2 z-20 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-md">
                    LIVE
                  </div>
                )}

                {playbackId ? (
                  <div
                    onClick={() => openModal(playbackId)}
                    className="w-full aspect-video bg-black overflow-hidden"
                  >
                    <MuxPlayer
  playbackId={playbackId}
  autoPlay={false}
  muted
  loop
  className="w-full h-48 object-cover block transition-transform duration-300 group-hover:scale-105"
/>

                  </div>
                ) : media?.type === 'image' ? (
                  <img
                    src={media.url}
                    alt={`Property image ${property.id}`}
                    className="w-full aspect-video object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full aspect-video bg-gray-300 flex items-center justify-center text-sm text-gray-700">
                    No Media Available
                  </div>
                )}

                {/* Unified Gradient Footer with Go Live */}
                <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white px-4 py-3 text-sm z-10 flex justify-between items-center">
                  <div>
                    <p className="font-semibold truncate">{property.city}</p>
                    <p className="text-xs">
                      ₦{property.price.toLocaleString()}k · {property.bedrooms} bed / {property.bathrooms} bath
                    </p>
                  </div>

                  <span
                    className="flex items-center gap-1 text-xs text-white hover:underline cursor-pointer hover:text-white transition-all duration-200 active:scale-95"
                    onClick={() =>
                      handleOpenGoLive({
                        id: property.id,
                        title: `${property.description} in ${property.city}`,
                      })
                    }
                  >
                    <Globe size={14} />
                    Go Live
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && currentPlaybackId && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50"
          onClick={closeModal}
        >
          <div
            className="relative w-full max-w-4xl mx-auto p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <MuxPlayer
              playbackId={currentPlaybackId}
              autoPlay={false}
              // @ts-ignore
              controls
              style={{ width: '100%', height: 'auto' }}
            />
            <button
              className="absolute top-2 right-2 text-white text-xl"
              onClick={closeModal}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {showGoLiveModal && selectedPropertyId && (
        <GoLiveForm
          propertyId={selectedPropertyId.toString()}
          onClose={handleCloseGoLive}
        />
      )}
    </div>
  );
};

export default MyPropertyList;
