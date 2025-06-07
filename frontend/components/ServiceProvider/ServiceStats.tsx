'use client';

import React, { useEffect, useState } from "react";
import {
  CheckCircle,
  RefreshCw,
  Wallet,
  BadgeCheck,
} from "lucide-react";
import axios from "axios";
import { useUser } from "@/context/UserContext";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002';

interface StatsData {
  jobsCompleted: number;
  ongoingJobs: number;
  totalJobs: number;
  successRate: number;
  earnings: number;
  rating: number;
  reviewCount: number;
}

export default function ServiceStats() {
  const [statsData, setStatsData] = useState<StatsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { token, refreshAccessToken, isTokenExpired } = useUser();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        let currentToken = token;

        if (isTokenExpired(token)) {
          await refreshAccessToken();
          currentToken = localStorage.getItem('token');
        }

        if (!currentToken) {
          throw new Error("User is not authenticated.");
        }

        const response = await axios.get(`${apiUrl}/api/service-provider/stats`, {
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
        });

        setStatsData(response.data);
      } catch (err) {
        console.error("Failed to fetch stats:", err);
        setError("Unable to load stats. Please try again later.");
      }
    };

    fetchStats();
  }, [token, refreshAccessToken, isTokenExpired]);

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  if (!statsData) {
    return (
      <div className="w-full max-w-5xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5 mb-8">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-2xl" />
        ))}
      </div>
    );
  }

  const stats = [
    {
      id: 1,
      label: "Jobs Completed",
      value: new Intl.NumberFormat().format(statsData.jobsCompleted),
      icon: CheckCircle,
      iconBg: "bg-blue-100 dark:bg-blue-900",
      iconColor: "text-blue-500",
    },
    {
      id: 2,
      label: "Ongoing Jobs",
      value: new Intl.NumberFormat().format(statsData.ongoingJobs),
      icon: RefreshCw,
      iconBg: "bg-yellow-100 dark:bg-yellow-900",
      iconColor: "text-yellow-500",
    },
    {
      id: 3,
      label: "Earnings",
      value: new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(statsData.earnings),
      icon: Wallet,
      iconBg: "bg-green-100 dark:bg-green-900",
      iconColor: "text-green-500",
    }, 

    {
      id: 4,
      label: "Rating",
      value: statsData.rating.toFixed(1),
      icon: BadgeCheck,
      iconBg: "bg-purple-100 dark:bg-purple-900",
      iconColor: "text-purple-500",
    },
    {
      id: 5,
      label: "Success Rate",
      value: `${statsData.successRate.toFixed(1)}%`,
      icon: CheckCircle,
      iconBg: "bg-teal-100 dark:bg-teal-900",
      iconColor: "text-teal-500",
    },
    {
      id: 6,
      label: "Reviews",
      value: new Intl.NumberFormat().format(statsData.reviewCount),
      icon: BadgeCheck,
      iconBg: "bg-pink-100 dark:bg-pink-900",
      iconColor: "text-pink-500",
    },
  ];

  return (
    <div
      className="
        w-full max-w-5xl
        flex overflow-x-auto space-x-4
        sm:grid sm:grid-cols-2 sm:gap-5
        md:grid-cols-3
        lg:grid-cols-6
        mb-8
        scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200
        "
    >
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.id}
            title={stat.label}
            className="
              dark:bg-gray-900 p-5 rounded-2xl shadow-md text-center
              hover:shadow-lg transition-all duration-300 transform hover:scale-[1.03]
              min-w-[150px]
              flex-shrink-0
            "
          >
            <div
      className={`flex items-center justify-center w-10 h-10 rounded-full mx-auto mb-3 ${stat.iconBg} transition-colors`}
              >
            <Icon className={`${stat.iconColor} transition-colors`} size={20} />
          </div>

            <h3 className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</h3>
            <p className="text-2xl font-bold text-black dark:text-white">{stat.value}</p>
          </div>
        );
      })}
    </div>
  );
  
}
