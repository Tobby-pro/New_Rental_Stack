'use client';

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { useUser } from "@/context/UserContext";
import { format } from "date-fns";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002';

interface Service {
  id: number;
  title: string;
  description: string;
  price: number;
  createdAt: string;
}

interface ServiceListProps {
  setModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function ServiceList({ setModalOpen }: ServiceListProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const { token, refreshAccessToken, isTokenExpired } = useUser();

  useEffect(() => {
    const fetchServices = async () => {
      try {
        let currentToken = token;

        if (isTokenExpired(token)) {
          await refreshAccessToken();
          currentToken = localStorage.getItem('token');
        }

        if (!currentToken) {
          throw new Error("User is not authenticated.");
        }

        const response = await axios.get(`${apiUrl}/api/service-provider/services`, {
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
        });

        setServices(response.data);
      } catch (err) {
        console.error("Failed to fetch services:", err);
        setError("Unable to load services. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [token, refreshAccessToken, isTokenExpired]);

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-40 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl p-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Available Services</h2>
        <p className="text-gray-600">These are the services you offer.</p>
      </div>

      <div className="mb-6 text-right">
        <button
          onClick={() => setModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl transition"
        >
          Add New Service
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map((service) => (
          <Card
            key={service.id}
            className="shadow-md rounded-2xl p-4 hover:shadow-xl transition"
          >
            <CardContent>
              <CardTitle className="text-base font-bold">{service.title}</CardTitle>

              <div className="text-gray-600 text-sm mt-1">
                <p className="line-clamp-2">{service.description}</p>
              </div>

              <div className="mt-3 flex justify-between items-center">
                <p className="text-blue-600 font-semibold text-sm">
                  ₦{service.price.toLocaleString()}
                </p>
                <p className="text-xs text-gray-400">
                  {format(new Date(service.createdAt), 'PPP')}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
