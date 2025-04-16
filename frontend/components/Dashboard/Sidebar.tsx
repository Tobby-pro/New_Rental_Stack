"use client";

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useUser } from '@/context/UserContext';
import Image from 'next/image';
import { FiKey, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002';

const Sidebar = ({
  onClose,
  onLinkClick,
  setModalOpen,
}: {
  onClose: () => void;
  onLinkClick: (view: string) => void;
  setModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const { username, userRole, sidebarLinks, token } = useUser();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement | null>(null);

const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // Optional: Check if the file is an image
  if (!file.type.startsWith('image/')) {
    alert('Please upload a valid image file.');
    return;
  }

  const reader = new FileReader();

  reader.onloadend = async () => {
    const base64Image = (reader.result as string).split(',')[1]; // Removes the data:image/... prefix

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

      // Update the UI with the new profile image URL
      setProfileImage(response.data.url);
      localStorage.setItem('profileImage', response.data.url); // Optionally save to localStorage

      console.log("Profile picture uploaded successfully:", response.data.url);
    } catch (error) {
      console.error("❌ Error uploading profile image:", error);
      alert("Failed to upload image. Please try again.");
    }
  };

  reader.readAsDataURL(file); // Trigger the file read
};

  useEffect(() => {
    const savedImage = localStorage.getItem('profileImage');
    if (savedImage) {
      setProfileImage(savedImage);
    }
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 300); // Wait for animation before closing
  };

  const handleOpen = () => {
    setIsClosing(false); // This will trigger the opening animation
  };

    return (
    <AnimatePresence>
      {!isClosing && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          {/* Sidebar */}
          <motion.div
            ref={sidebarRef}
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 bottom-0 left-0 w-64 shadow-md text-white h-full bg-[rgb(5,8,42)] z-50"
            style={{ height: '100vh', overflowY: 'hidden' }}
            onAnimationComplete={() => {
              if (isClosing) onClose();
            }}
          >
            {/* Close Button */}
            <div className="flex justify-end p-4 md:hidden">
              <button onClick={handleClose} aria-label="Close Sidebar" className="text-white">
                <FiX size={24} />
              </button>
            </div>

            {/* Logo Section */}
            <div className="flex items-center justify-center py-8 border-b border-gray-600">
              <Image
                src="/images/dirent_transparent.svg"
                alt="dirent_transparent.svg"
                priority
                width={120}
                height={120}
                style={{ width: '130px', height: 'auto', margin: '5px' }}
              />
            </div>

            {/* Profile Section */}
            <div className="flex flex-col items-center py-8 space-y-4">
              <div className="relative w-12 h-12">
                <div className="relative w-full h-full rounded-full overflow-hidden border-2 border-white">
                  {profileImage ? (
                    <Image
                      src={profileImage}
                      alt="Profile Picture"
                      priority
                      fill
                      sizes="40px"
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <Image
                      src="/images/sillo.png"
                      alt="Profile Picture Placeholder"
                      fill
                      sizes="40px"
                      style={{ objectFit: 'cover' }}
                      priority
                    />
                  )}
                </div>
                <input
                  type="file"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={handleFileUpload}
                />
              </div>

              <div className="text-lg font-semibold">
                {username ? username.charAt(0).toUpperCase() + username.slice(1).toLowerCase() : 'Guest'}
              </div>
              <div className="text-sm text-gray-300">{userRole}</div>
            </div>

            {/* Sidebar Links */}
            <nav className="flex flex-col h-full py-4">
              <ul className="space-y-2">
                {userRole?.toLowerCase() === 'landlord' && (
                  <li
                    onClick={() => {
                      setModalOpen(true);
                      handleClose();
                    }}
                  >
                    <div className="flex items-center px-6 py-3 font-bold text-lg border-t border-b border-gray-600 cursor-pointer">
                      <FiKey className="mr-2" /> My Properties
                    </div>
                  </li>
                )}

                {sidebarLinks.map((link) => (
                  <li key={link.name} onClick={() => { onLinkClick(link.name); handleClose(); }}>
                    <div className="flex items-center px-6 py-3 hover:bg-blue-500 hover:text-white cursor-pointer">
                      <link.icon className="mr-2" /> {link.name}
                    </div>
                  </li>
                ))}
              </ul>
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Sidebar;
