import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";

interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
}

export default function ServiceDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchService = async () => {
      try {
        const res = await fetch(`/api/services/${id}`);
        const data = await res.json();
        setService(data);
      } catch (error) {
        console.error("Error fetching service:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchService();
  }, [id]);

  if (loading) return <p className="text-center mt-10 text-gray-500">Loading...</p>;
  if (!service) return <p className="text-center mt-10 text-red-500">Service not found.</p>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-6 py-10">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-2xl shadow">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{service.name}</h1>
        <p className="mt-4 text-gray-600 dark:text-gray-300">{service.description}</p>
        <p className="mt-6 text-xl font-semibold text-blue-600">₦{service.price.toLocaleString()}</p>
      </div>
    </div>
  );
}
