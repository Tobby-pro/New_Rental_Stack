import React, { useState, ChangeEvent, FormEvent } from 'react';
import VideoUploadModal from './VideoUploadModal';
import { motion, AnimatePresence } from 'framer-motion';
interface AddPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => Promise<void>;
  isSubmitting: boolean;
  error: string | null;
  setAlertMessage: (message: string | null) => void;
}

interface PropertyFormData {
  address: string;
  city: string;
  state: string;
  price: number | string;
  bedrooms: number | string;
  bathrooms: number | string;
  media: File[];
  description: string;
  liveEnabled: boolean;
  liveTitle: string;
  liveDate: string;
  liveDuration: number | string;
}

const AddPropertyModal: React.FC<AddPropertyModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  error,
  setAlertMessage,
}) => {
  const [propertyData, setPropertyData] = useState<PropertyFormData>({
    address: '',
    city: '',
    state: '',
    price: '',
    bedrooms: '',
    bathrooms: '',
    media: [],
    description: '',
    liveEnabled: false,
    liveTitle: '',
    liveDate: '',
    liveDuration: '',
  });

  const [success, setSuccess] = useState<string | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [showSuccessCheck, setShowSuccessCheck] = useState(false);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
  const target = e.target as HTMLInputElement;
  const { name, value, type } = target;

  
  setPropertyData((prevData) => ({
    ...prevData,
    [name]: type === 'checkbox' ? target.checked : value,
  }));
};


const handleTextareaChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
  const { name, value } = e.target;
  setPropertyData((prevData) => ({
    ...prevData,
    [name]: value,
  }));
};

  const handleVideoSubmit = async (file: File) => {
  setUploadingVideo(true);
  
  // Simulate upload delay (or use real upload logic)
  setTimeout(() => {
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
    setIsVideoModalOpen(false);
    setPropertyData((prev) => ({
      ...prev,
      media: [file],
    }));
    setUploadingVideo(false);
  }, 1500);
};

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (
      !propertyData.address ||
      !propertyData.city ||
      !propertyData.state ||
      !propertyData.price ||
      !propertyData.bedrooms ||
      !propertyData.bathrooms ||
      propertyData.media.length === 0
    ) {
      alert('Please fill in all required fields and upload a video.');
      return;
    }

    if (propertyData.liveEnabled) {
      if (
        !propertyData.liveTitle ||
        !propertyData.liveDate ||
        !propertyData.liveDuration
      ) {
        alert('Please fill in all live session details.');
        return;
      }
    }

    const data = new FormData();
    data.append('address', propertyData.address);
    data.append('city', propertyData.city);
    data.append('state', propertyData.state);
    data.append('price', propertyData.price.toString());
    data.append('bedrooms', propertyData.bedrooms.toString());
    data.append('bathrooms', propertyData.bathrooms.toString());
    data.append('description', propertyData.description || '');

    if (propertyData.liveEnabled) {
      data.append('liveEnabled', 'true');
      data.append('liveTitle', propertyData.liveTitle);
      data.append('liveDate', propertyData.liveDate);
      data.append('liveDuration', propertyData.liveDuration.toString());
    }

    propertyData.media.forEach((mediaFile) => {
      data.append('media', mediaFile);
    });

    try {
  await onSubmit(data);
  setAlertMessage('Property added successfully!');
  setShowSuccessCheck(true);
  
  // Delay before closing
  setTimeout(() => {
    setShowSuccessCheck(false);
    onClose();
  }, 2000);
} catch (err) {
  console.error('Submission error:', err);
}

  };

  const backdrop = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };

  const modal = {
    hidden: { opacity: 0, scale: 0.95, y: 40 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { type: 'spring', damping: 20, stiffness: 300 },
    },
    exit: { opacity: 0, scale: 0.95, y: 40 },
  };

  if (!isOpen) return null;

return (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`fixed inset-0 z-50 flex items-center sm:items-center justify-center px-4`}
      >
        {/* Overlay */}
        <div
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 40 }}
          transition={{ duration: 0.3 }}
          className={`relative z-50 w-full max-w-lg bg-white rounded-t-2xl sm:rounded-lg shadow-xl p-6 sm:max-h-[90vh] overflow-y-auto`}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Add New Property</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="text-red-500">{error}</div>}
            {success && <div className="text-green-500">{success}</div>}

            <div className="relative">
              <input
                type="text"
                name="address"
                value={propertyData.address}
                onChange={handleInputChange}
                className="text-black bg-white peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2 text-sm placeholder-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Address"
                required
              />
              <label className="absolute left-3 top-2 text-xs text-gray-500 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-xs transition-all">
                Address
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <input
                  type="text"
                  name="city"
                  value={propertyData.city}
                  onChange={handleInputChange}
                  className="text-black bg-white peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2 text-sm placeholder-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="City"
                  required
                />
                <label className="absolute left-3 top-2 text-xs text-gray-500 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-xs transition-all">
                  City
                </label>
              </div>

              <div className="relative">
                <select
                  name="state"
                  value={propertyData.state}
                  onChange={handleInputChange}
                  className="text-black bg-white w-full border border-gray-300 rounded-md px-3 pt-5 pb-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select State</option>
                  {[
                    'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
                    'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','Gombe','Imo','Jigawa',
                    'Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger',
                    'Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara'
                  ].map((state) => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
                <label className="absolute left-3 top-2 text-xs text-gray-500">State</label>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <input
                type="number"
                name="price"
                value={propertyData.price}
                onChange={handleInputChange}
                placeholder="Price"
                className="text-black bg-white w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <select
  name="bedrooms"
  value={propertyData.bedrooms}
  onChange={handleInputChange}
  className="text-black outline-[0.5] bg-white w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
  required
>
  <option value="">bedrooms</option>
  {[...Array(10)].map((_, i) => (
    <option key={i + 1} value={i + 1}>
      {i + 1}
    </option>
  ))}
</select>

<select
  name="bathrooms"
  value={propertyData.bathrooms}
  onChange={handleInputChange}
  className="text-black bg-white w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
  required
>
  <option value="">bathrooms</option>
  {[...Array(10)].map((_, i) => (
    <option key={i + 1} value={i + 1}>
      {i + 1}
    </option>
  ))}
</select>

            </div>

            <div className="relative">
              <textarea
                name="description"
                value={propertyData.description}
                onChange={handleTextareaChange}
                className="text-black bg-white peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2 text-sm placeholder-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g.,2-bedroom apartment in Lekki....."
                rows={4}
              />
              <label className="absolute left-3 top-2 text-xs text-gray-500 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-xs transition-all">
                Description
              </label>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Enable Live Session</label>
              <input
                type="checkbox"
                name="liveEnabled"
                checked={propertyData.liveEnabled}
                onChange={handleInputChange}
                className="text-black bg-white form-checkbox h-4 w-4"
              />
            </div>

            {propertyData.liveEnabled && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <input
                  type="text"
                  name="liveTitle"
                  value={propertyData.liveTitle}
                  onChange={handleInputChange}
                  placeholder="e.g., 2-bedroom apartment in Lekki"
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="date"
                  name="liveDate"
                  value={propertyData.liveDate}
                  onChange={handleInputChange}
                  className="text-black bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  name="liveDuration"
                  value={propertyData.liveDuration}
                  onChange={handleInputChange}
                  placeholder="Duration (mins)"
                  className="text-black bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div className="mt-4">
              <button
                type="button"
                onClick={() => setIsVideoModalOpen(true)}
                className="w-full py-2 px-4 text-sm font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                {videoFile ? 'Replace Video' : 'Upload Video'}
              </button>

              {videoPreview && (
                <video
                  src={videoPreview}
                  controls
                  className="mt-2 w-full h-32 rounded shadow"
                />
              )}
            </div>

            <button
  type="submit"
  disabled={isSubmitting || uploadingVideo}
  className={`w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-md transition duration-300 ${
    isSubmitting || uploadingVideo ? 'opacity-60 cursor-not-allowed' : 'hover:bg-blue-700'
  }`}
>
  {isSubmitting ? (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  ) : showSuccessCheck ? (
    <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ) : (
    'Add Property'
  )}
</button>

          </form>
          {uploadingVideo && (
  <div className="flex items-center gap-2 text-blue-600 text-sm font-medium">
    <svg className="animate-spin h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
    Uploading video...
  </div>
)}
        </motion.div>

        {isVideoModalOpen && (
          <VideoUploadModal
            isOpen={isVideoModalOpen}
            onClose={() => setIsVideoModalOpen(false)}
            onSubmit={handleVideoSubmit}
          />
        )}
      </motion.div>
    )}
  </AnimatePresence>
);
}

export default AddPropertyModal; 