'use client';
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useUser } from "@/context/UserContext";
import toast from "react-hot-toast";

interface AddServiceModalProps {
  setModalOpen: (open: boolean) => void;
}

const AddServiceModal: React.FC<AddServiceModalProps> = ({ setModalOpen }) => {
  const [visible, setVisible] = useState(false);
  const [selectedService, setSelectedService] = useState("");
  const [mainDescription, setMainDescription] = useState("");
  const [extraDescriptions, setExtraDescriptions] = useState<string[]>([]);
  const [showExtraOptions, setShowExtraOptions] = useState(false);
  const [selectedPrice, setSelectedPrice] = useState<number | "">("");
  const [selectedLocation, setSelectedLocation] = useState(""); // 🆕
  const [serviceTitles, setServiceTitles] = useState<string[]>([]);
  const [priceOptions, setPriceOptions] = useState<number[]>([]);
  const [serviceDescriptions, setServiceDescriptions] = useState<{ [key: string]: string[] }>({});
  const [descriptionOptions, setDescriptionOptions] = useState<string[]>([]);

  const { token, refreshAccessToken, isTokenExpired } = useUser();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4002";

  useEffect(() => {
    setVisible(true);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    const fetchOptions = async () => {
      try {
        const res = await axios.get(`${apiUrl}/api/service-options`);
        const { serviceTitles, priceOptions, serviceDescriptions } = res.data;

        if (Array.isArray(serviceTitles)) setServiceTitles(serviceTitles);
        else setServiceTitles([]);

        if (Array.isArray(priceOptions)) setPriceOptions(priceOptions);
        else setPriceOptions([]);

        if (typeof serviceDescriptions === "object") setServiceDescriptions(serviceDescriptions);
        else setServiceDescriptions({});
      } catch (err) {
        console.error("Failed to fetch options", err);
        setServiceTitles([]);
        setPriceOptions([]);
        setServiceDescriptions({});
      }
    };

    fetchOptions();

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (selectedService && serviceDescriptions[selectedService]) {
      setDescriptionOptions(serviceDescriptions[selectedService]);
    } else {
      setDescriptionOptions([]);
    }
    setMainDescription("");
    setExtraDescriptions([]);
    setShowExtraOptions(false);
  }, [selectedService, serviceDescriptions]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => setModalOpen(false), 300);
  };

  const handleExtraToggle = (desc: string) => {
    if (extraDescriptions.includes(desc)) {
      setExtraDescriptions(extraDescriptions.filter((d) => d !== desc));
    } else {
      setExtraDescriptions([...extraDescriptions, desc]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let validToken = token;
    if (!validToken || isTokenExpired(validToken)) {
      validToken = await refreshAccessToken();
      if (!validToken) {
        console.error("Unable to refresh token.");
        return;
      }
    }

    const combinedDescription = [mainDescription, ...extraDescriptions].filter(Boolean).join(", ");

    const newService = {
      title: selectedService,
      description: combinedDescription,
      price: Number(selectedPrice),
      category: selectedService,
      location: selectedLocation // ✅ include location
    };

    try {
      await axios.post(`${apiUrl}/api/services`, newService, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${validToken}`,
        },
        withCredentials: true // ✅ ensures cookies are sent if your auth relies on them
      });

      toast.success("Service saved successfully!");

      setSelectedService("");
      setMainDescription("");
      setExtraDescriptions([]);
      setSelectedPrice("");
      setSelectedLocation("");
      handleClose();
    } catch (error) {
      console.error("Error saving service:", error);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      onClick={handleClose}
    >
      <div
        className={`bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 w-full max-w-md relative transform transition-transform duration-300 ${
          visible ? "scale-100 translate-y-0" : "scale-95 translate-y-5"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
          Add New Service
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Service selection */}
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
              Choose Service
            </label>
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            >
              <option value="">Choose a service</option>
              {serviceTitles.map((title, index) => (
                <option key={index} value={title}>
                  {title}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
              What do you do? (Pick one)
            </label>
            <select
              value={mainDescription}
              onChange={(e) => setMainDescription(e.target.value)}
              disabled={descriptionOptions.length === 0}
              className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            >
              <option value="">Choose a description</option>
              {descriptionOptions.map((desc, index) => (
                <option key={index} value={desc}>
                  {desc}
                </option>
              ))}
            </select>
            {descriptionOptions.length > 0 && !showExtraOptions && (
              <button
                type="button"
                onClick={() => setShowExtraOptions(true)}
                className="mt-2 text-blue-600 text-sm hover:underline"
              >
                [+] I do more things (optional)
              </button>
            )}
          </div>

          {/* Extra Descriptions */}
          {showExtraOptions && (
            <div className="mt-2 space-y-1">
              <p className="text-sm text-gray-500 dark:text-gray-400">Select more if they apply:</p>
              {descriptionOptions
                .filter((desc) => desc !== mainDescription)
                .map((desc, index) => (
                  <label key={index} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      value={desc}
                      checked={extraDescriptions.includes(desc)}
                      onChange={() => handleExtraToggle(desc)}
                      className="accent-blue-600"
                    />
                    {desc}
                  </label>
                ))}
            </div>
          )}

          {/* Price */}
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
              Choose Price (₦)
            </label>
            <select
              value={selectedPrice}
              onChange={(e) =>
                setSelectedPrice(e.target.value === "" ? "" : Number(e.target.value))
              }
              className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            >
              <option value="">Choose a price</option>
              {priceOptions.map((price, index) => (
                <option key={index} value={price}>
                  ₦{price.toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          {/* Location - 🆕 Added */}
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
              Choose Location
            </label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            >
              <option value="">Choose your location</option>
              <option value="Lagos">Lagos</option>
              <option value="Abuja">Abuja</option>
              <option value="Port Harcourt">Port Harcourt</option>
              <option value="Enugu">Enugu</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-black dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition"
            >
              Save Service
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddServiceModal;
