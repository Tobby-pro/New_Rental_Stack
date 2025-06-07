// pages/services/index.tsx

import React, { useEffect, useState } from "react";
import Link from "next/link";

interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
}


export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await fetch("/api/services");
        const data = await res.json();
        setServices(data);
      } catch (error) {
        console.error("Error fetching services:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-8">
      <h1 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-10">
        Available Services
      </h1>

      {loading ? (
        <p className="text-center text-gray-500 dark:text-gray-300">Loading...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {services.map((service) => (
            <div
              key={service.id}
              className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow hover:shadow-lg transition"
            >
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">{service.name}</h2>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                {service.description.length > 80
                  ? service.description.slice(0, 80) + "..."
                  : service.description}
              </p>
              <p className="text-blue-600 font-bold mt-4">₦{service.price.toLocaleString()}</p>

              <Link
                href={`/services/${service.id}`}
                className="inline-block mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition"
              >
                View Details
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
