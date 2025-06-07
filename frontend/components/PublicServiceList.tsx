// PublicServiceList.tsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface ServiceProvider {
  id: string;
  name: string;
  serviceType: string;
  rating: number;
  location: string;
  image?: string;
}

const PublicServiceList = () => {
  const [services, setServices] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002';

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await axios.get(`${apiUrl}/api/public/services`);
        setServices(res.data);
      } catch (err: any) {
        setError('Could not load services');
        toast.error('Failed to load services');
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  if (loading) return <p className="text-gray-400">Loading services...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {services.map(service => (
        <div
          key={service.id}
          className="bg-gray-800 p-4 rounded-xl shadow hover:shadow-lg transition"
        >
          <h3 className="text-lg font-semibold">{service.name}</h3>
          <p className="text-sm text-gray-400">{service.serviceType}</p>
          <p className="text-sm text-gray-500">Location: {service.location}</p>
          <p className="text-sm text-yellow-400">Rating: ⭐ {service.rating}</p>
          <button
            className="mt-2 px-4 py-1 text-sm bg-blue-600 hover:bg-blue-700 rounded"
            onClick={() => toast.success(`Viewing ${service.name}`)}
          >
            View Details
          </button>
        </div>
      ))}
    </div>
  );
};

export default PublicServiceList;
