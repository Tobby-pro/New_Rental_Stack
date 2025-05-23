import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useUser } from '@/context/UserContext';
import { PieChart, Pie, Cell, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Globe, Plus } from 'lucide-react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { MdAddHome } from 'react-icons/md';
import TourGuide from '@/components/TourGuide';
import { Step } from 'react-joyride';

interface LandlordDashboardGridProps {
  className?: string;
  setModalOpen: (value: boolean) => void;
}

const LandlordDashboardGrid: React.FC<LandlordDashboardGridProps> = ({ className, setModalOpen }) => {
  const { token, refreshAccessToken, isTokenExpired, username } = useUser();
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [totalProperties, setTotalProperties] = useState(0);
  const [rentedProperties, setRentedProperties] = useState(0);
  const [availableProperties, setAvailableProperties] = useState(0);
  const [valueTrendData, setValueTrendData] = useState<{ date: string; value: number }[]>([]);
  const [showStats, setShowStats] = useState(false);
  const [runTour, setRunTour] = useState(false);
  const [uiReady, setUiReady] = useState(false);
  const [profileImage, setProfileImage] = useState('');
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002';
  const router = useRouter();

  const tourSteps: Step[] = [
    {
      target: '.add-property-tour',
      content: 'Click here to add a new property for rent!',
      placement: 'bottom',
      disableBeacon: true,
      spotlightPadding: 10,
      styles: {
        options: {
          width: 260,
          zIndex: 9999,
        },
        tooltip: {
          backgroundColor: '#f5f5f5',
          color: '#555',
          fontSize: '12px',
        },
        tooltipContent: {
          fontSize: '12px',
        },
      },
    },
  ];

  useEffect(() => {
    const savedImage = localStorage.getItem('profileImage');
    if (savedImage) setProfileImage(savedImage);

    const delay = setTimeout(() => setUiReady(true), 1000);
    return () => clearTimeout(delay);
  }, []);

  useEffect(() => {
    if (uiReady) {
      const timeout = setTimeout(() => {
        const target = document.querySelector('.add-property-tour');
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setRunTour(true);
        }
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [uiReady]);

  const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const getFirstName = (fullName: string) => {
    const names = fullName.split(' ');
    return names[0];
  };

  useEffect(() => {
    if (username) {
      const firstName = capitalizeFirstLetter(getFirstName(username));
      const userKey = `hasVisitedDashboard_${username}`;
      const hasVisited = localStorage.getItem(userKey);

      if (!hasVisited) {
        setWelcomeMessage(`Welcome, ${firstName}`);
        localStorage.setItem(userKey, 'true');
      } else {
        setWelcomeMessage(`Welcome back, ${firstName}`);
      }
    }

    const fetchPropertyCount = async (accessToken: string) => {
      try {
        const res = await axios.get(`${apiUrl}/api/landlord/properties/count`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const total = res.data.totalProperties;
        setTotalProperties(total);

        const rented = Math.floor(total * 0.6);
        setRentedProperties(rented);
        setAvailableProperties(total - rented);
      } catch (error) {
        console.error('Error fetching property count:', error);
      }
    };

    const checkAndFetch = async () => {
      if (!token) return;

      let validToken = token;

      if (isTokenExpired(token)) {
        const refreshed = await refreshAccessToken();
        if (typeof refreshed === 'string') {
          validToken = refreshed;
        } else {
          console.error('Token refresh failed');
          return;
        }
      }

      await fetchPropertyCount(validToken);
    };

    checkAndFetch();

    setValueTrendData([
      { date: 'January', value: 300000 },
      { date: 'February', value: 310000 },
      { date: 'March', value: 320000 },
      { date: 'April', value: 330000 },
    ]);

    const timer = setTimeout(() => {
      setShowStats(true);
    }, 600);

    return () => clearTimeout(timer);
  }, [username]);

  const COLORS = ['#4CAF50', '#FF9800'];

  return (
    <div className={`grid auto-rows-max grid-cols-1 gap-6 p-6 ${className}`}>
      <motion.div
        className="max-h-[320px] row-span-1 p-6 shadow-lg rounded-xl bg-white"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-3xl font-semibold bg-gradient-to-b from-black-100 to-violet-500 text-transparent bg-clip-text">
          {welcomeMessage}
        </h2>
        <p className="text-sm text-gray-500">Your property portfolio report</p>
        <div className="flex justify-between mt-40 text-blue-600 font-medium text-sm cursor-pointer">
          <span
            className="flex items-center gap-1 hover:underline"
            onClick={() => {
              const roomId = username ? `${username}-room` : 'default-room';
              router.push(`/host?room=${roomId}`);
            }}
          >
            <Globe size={16} /> Go Live
          </span>

          <span
            className="flex items-center gap-1 hover:underline"
            onClick={() => setModalOpen(true)}
          >
            <MdAddHome className="text-2xl add-property-tour" data-tour="add" />
          </span>
        </div>
      </motion.div>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-3 gap-6 row-span-1 text-sm"
        initial={{ opacity: 0, y: 30 }}
        animate={showStats ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
      >
        <div className="p-6 shadow-lg rounded-xl bg-white flex flex-col justify-center items-center">
          <h4 className="text-md font-medium text-gray-800">Total Properties</h4>
          <p className="text-3xl font-bold text-blue-600">{totalProperties}</p>
        </div>

        <div className="p-6 shadow-lg rounded-xl bg-white flex flex-col justify-center items-center">
          <h4 className="text-md font-medium text-gray-800">Properties Rented vs Available</h4>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Rented', value: rentedProperties },
                  { name: 'Available', value: availableProperties },
                ]}
                dataKey="value"
                outerRadius={80}
                fill="#8884d8"
              >
                {COLORS.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="p-6 shadow-lg rounded-xl bg-white flex flex-col justify-center items-center">
          <h4 className="text-md font-medium text-gray-800">Value Trends</h4>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={valueTrendData}>
              <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <TourGuide run={runTour} steps={tourSteps} />
    </div>
  );
};

export default LandlordDashboardGrid;
