"use client";

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useUser } from '@/context/UserContext';
import Image from 'next/image';
import { FiKey, FiLogOut } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/router';
import TourGuide from '@/components/TourGuide';
import { Step } from 'react-joyride';
import { MdAddHome } from 'react-icons/md';
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002';

type SidebarProps = {
  isMobile: boolean;
  visible?: boolean;
  onClose: () => void;
  onLinkClick: (view: string) => void;
  setModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onChatToggle?: () => void;
};

const Sidebar = ({ visible = true, onClose, onLinkClick, setModalOpen, onChatToggle, isMobile }: SidebarProps) => {
  const { username, userRole, sidebarLinks, token } = useUser();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  const [runTour, setRunTour] = useState(false);
  const [uiReady, setUiReady] = useState(false);
  const [forceSidebarOpen, setForceSidebarOpen] = useState(false);

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
          color: '#555', // softer gray text
          fontSize: '12px', // smaller font size
        },
        tooltipContent: {
          fontSize: '12px',
        },
      }
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
      setForceSidebarOpen(true);
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Image = (reader.result as string).split(',')[1];
      try {
        const response = await axios.post(
          `${apiUrl}/api/upload-profile-pic`,
          { image: base64Image },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            withCredentials: true,
          }
        );
        setProfileImage(response.data.url);
        localStorage.setItem('profileImage', response.data.url);
      } catch (error) {
        console.error("❌ Error uploading profile image:", error);
        alert("Failed to upload image. Please try again.");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLogout = async () => {
    try {
      const response = await axios.post(`${apiUrl}/logout`, {}, { withCredentials: true });
      if (response.status === 200) {
        localStorage.removeItem('profileImage');
        localStorage.removeItem('userToken');
        router.push('/');
      }
    } catch (error) {
      console.error('Logout error:', error);
      alert('An error occurred during logout. Please try again.');
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 300);
  };

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <>
      <div className={`flex items-center justify-center py-6 ${!isMobile ? 'border-b border-gray-600' : ''}`}>
        <Image
          src="/images/dirent_transparent.svg"
          alt="Logo"
          width={100}
          height={100}
          className="w-[100px] h-auto"
          priority
        />
      </div>

      {!isMobile && (
        <div className="flex flex-col items-center py-6 space-y-4">
          <div className="relative w-12 h-12">
            <div className="relative w-full h-full rounded-full overflow-hidden border-2 border-white">
              <Image
                src={profileImage || '/images/sillo.png'}
                alt="Profile"
                fill
                sizes="40px"
                className="object-cover"
                priority
              />
            </div>
            <input
              type="file"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={handleFileUpload}
            />
          </div>
          <div className="text-sm text-gray-300 capitalize">{username || 'Guest'}</div>
          <div className="text-sm text-gray-300">{userRole}</div>
        </div>
      )}

      <nav className="flex flex-col items-center">
        <ul className="w-full space-y-2">
          {userRole?.toLowerCase() === 'landlord' && (
            <li
              onClick={() => {
                setModalOpen(true);
                setRunTour(false);
                setForceSidebarOpen(false);
                handleClose();
              }}
              className={`cursor-pointer px-4 py-3 flex items-center text-gray-300 hover:text-white ${
                isMobile ? 'hover:bg-blue-500 rounded-lg justify-center' : 'px-6 justify-start'
              }`}
            >
              <MdAddHome className="text-xl" data-tour="add" />
              {!isMobile && <span className="ml-2 text-sm">Add Properties</span>}
            </li>
          )}

          {sidebarLinks.map((link) => (
            <li
              key={link.name}
              onClick={() => {
                if (link.name === 'Messages' && onChatToggle) {
                  onChatToggle();
                }
                onLinkClick(link.name);
                setForceSidebarOpen(false);
                handleClose();
              }}
              className={`cursor-pointer px-4 py-3 flex items-center text-gray-300 hover:text-white ${
                isMobile ? 'hover:bg-blue-500 rounded-lg justify-center' : 'px-6 justify-start'
              }`}
            >
              <link.icon className="text-xl" />
              {!isMobile && <span className="ml-2 text-sm">{link.name}</span>}
            </li>
          ))}

          <li
            onClick={handleLogout}
            className={`cursor-pointer px-4 py-3 flex items-center text-gray-300 hover:text-white ${
              isMobile ? 'hover:bg-red-500 rounded-lg justify-center' : 'px-6 justify-start'
            }`}
          >
            <FiLogOut className="text-xl" />
            {!isMobile && <span className="ml-2 text-sm">Logout</span>}
          </li>
        </ul>
      </nav>
    </>
  );

  return (
    <>
      <div
        className={`hidden md:flex fixed top-0 left-0 h-full w-64 bg-[rgb(5,8,42)] shadow-lg z-30 text-white flex-col transition-transform duration-300 ease-in-out ${
          visible ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent />
      </div>

      <AnimatePresence>
        {!isClosing && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
            />
            <motion.div
              ref={sidebarRef}
              initial={{ x: -100, opacity: 0, scale: 0.9 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              exit={{ x: -100, opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 200, damping: 25 }}
              className={`fixed top-4 left-4 ${forceSidebarOpen ? 'w-64 p-6' : 'w-16 p-3'} rounded-2xl h-auto bg-[rgb(5,8,42)] shadow-2xl z-50 flex flex-col items-center space-y-4 md:hidden transition-all duration-300`}
            >
              <SidebarContent isMobile />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <TourGuide run={runTour} steps={tourSteps} onTourEnd={() => {
        setRunTour(false);
        setForceSidebarOpen(false);
      }} />
    </>
  );
};

export default Sidebar;
