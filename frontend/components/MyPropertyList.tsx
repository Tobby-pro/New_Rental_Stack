import React, { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import CustomLoading from './Loading';
import { useUser } from '@/context/UserContext';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002';

interface Media {
  type: string;
  id: number;
  url: string;
  propertyId: number;
  createdAt: string;
  updatedAt: string;
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
}

interface MyPropertyListProps {
  className?: string;
}

const MyPropertyList: React.FC<MyPropertyListProps> = ({ className }) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState<Record<number, boolean>>({});
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [currentVideo, setCurrentVideo] = useState<string>('');

  const {
    token,
    refreshAccessToken,
    isTokenExpired,
  } = useUser();

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

  const openModal = (videoUrl: string) => {
    setCurrentVideo(videoUrl);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentVideo('');
  };

  if (loading) return <CustomLoading />;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className={`p-6 ${className}`}>
      <h1 className="text-left text-sm font-semibold mb-6">Properties Created by You</h1>
      {properties.length === 0 ? (
        <p className="text-gray-500 text-sm">You have no properties yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-[100%]">
          {properties.map((property) => (
            <div className="relative bg-white shadow-md rounded-lg overflow-hidden group" key={property.id}>
              <div className="inner-container w-full h-full p-0 bg-gradient-to-br from-white via-gray-700 to-gray-600">
                {property.media[0]?.type === 'video' ? (
                  <video
                    src={property.media[0]?.url}
                    className="w-full h-48 sm:h-64 md:h-72 lg:h-48 object-contain sm:object-cover transition-shadow duration-300 ease-in-out group-hover:shadow-lg cursor-pointer"
                    muted
                    playsInline
                    onMouseEnter={(e) => e.currentTarget.play()}
                    onMouseLeave={(e) => e.currentTarget.pause()}
                    onClick={() => openModal(property.media[0]?.url)}
                    onError={(e) => console.error('Error loading video:', e)}
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <img
                    src={property.media[0]?.url}
                    alt={`Property image ${property.id}`}
                    className="w-full h-48 object-cover transition-shadow duration-300 ease-in-out group-hover:shadow-lg"
                    onLoad={() => handleImageLoad(property.id)}
                    onError={() => handleImageError(property.id)}
                  />
                )}
                <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  <h2 className="text-white text-lg font-semibold">{property.address}</h2>
                  <p className="text-white text-sm">Town: {property.city}</p>
                  <p className="text-white text-sm">Price: ₦{property.price.toLocaleString()}k</p>
                  <p className="text-white text-sm">Bedrooms: {property.bedrooms}</p>
                  <p className="text-white text-sm">Bathrooms: {property.bathrooms}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50" onClick={closeModal}>
          <div className="relative">
            <video src={currentVideo} className="w-full h-auto sm:w-96 md:w-[80%] lg:w-[60%]" autoPlay controls>
              Your browser does not support the video tag.
            </video>
            <button className="absolute top-2 right-2 text-white text-xl" onClick={closeModal}>
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyPropertyList;
