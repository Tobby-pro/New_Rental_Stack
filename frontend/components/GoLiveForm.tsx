// components/GoLiveForm.tsx
"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import axios from 'axios';
import { useUser } from '@/context/UserContext'; // Import the useUser hook

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002'; // Initialize API URL

interface GoLiveFormProps {
  propertyId: string;
  onClose: () => void;
}

const GoLiveForm: React.FC<GoLiveFormProps> = ({ propertyId, onClose }) => {
  const { username, token, userId, userRole } = useUser(); // Destructure to get the logged-in user's username and token
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mode, setMode] = useState<"now" | "schedule">("now");
  const [scheduledTime, setScheduledTime] = useState("");
  
const handleSubmit = useCallback(async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    if (mode === "now") {
      // Dynamically set the role based on the user's role
      const role = username === 'landlord' ? 'host' : 'audience'; // Not used in request currently, just logic helper

      console.log("🔍 Submitting Go Live request with:");
      console.log("➡️ Username:", username);
      console.log("➡️ userRole (from context):", userRole); // This will help us confirm if it's 'LANDLORD' or 'landlord'
      console.log("➡️ userId (uid):", userId);
      console.log("➡️ propertyId (channelName):", propertyId);
      console.log("➡️ Token being sent:", token);

      // Fetch the Agora token
      const response = await axios.get(
        `${apiUrl}/api/agora-token`,
        {
          params: {
            channelName: propertyId,
            uid: userId,
            role: userRole,
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const { token: agoraToken } = response.data;

      console.log("✅ Agora token received:", agoraToken);

      // Redirect to the host page with the received token and channel name
     router.push(`/host?token=${agoraToken}&channel=${propertyId}&uid=${userId}`);

    } else {
      // Handle the scheduled stream mode
      console.log("🗓️ Scheduled Stream:", {
        propertyId,
        title,
        description,
        scheduledTime,
      });
      alert("Your stream is scheduled for " + scheduledTime);
      onClose();
    }
  } catch (err) {
    console.error("❌ Error fetching Agora token:", err);
    alert("An error occurred while preparing your live stream.");
  }
}, [mode, propertyId, title, description, scheduledTime, username, token, router, onClose]);


  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex text-blue-600 items-center justify-center backdrop-blur-sm bg-black/50 p-5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800">🎥 Go Live Setup</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Property Detail</label>
              <input
                type="text"
                value={propertyId}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-100 text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title (optional)</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border rounded border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter stream title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter stream description"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mode</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="now"
                    checked={mode === "now"}
                    onChange={() => setMode("now")}
                  />
                  Go Live Now
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="schedule"
                    checked={mode === "schedule"}
                    onChange={() => setMode("schedule")}
                  />
                  Schedule for Later
                </label>
              </div>
            </div>
            {mode === "schedule" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Date & Time</label>
                <input
                  type="datetime-local"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
            <div className="flex justify-between items-center pt-4">
              <button
                type="submit"
                className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 transition-all"
              >
                Continue
              </button>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 underline transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GoLiveForm;
