import React, { useState, ChangeEvent } from 'react';

interface VideoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (file: File) => void;
}

const VideoUploadModal: React.FC<VideoUploadModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [isInstructionDone, setIsInstructionDone] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);

  const handleVideoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (file) {
      setSelectedVideo(file); // Set selected video for preview
    }
  };

  const handleInstructionDone = () => {
    setIsInstructionDone(true);
  };

  const handleSubmit = () => {
    if (selectedVideo) {
      onSubmit(selectedVideo); // Submit the video
      onClose(); // Close the modal after submission
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-65" />

      {/* Modal Content */}
      <div className="bg-transparent rounded-lg w-full mx-6 max-w-lg p-6 shadow-lg relative z-50 sm:w-11/12 sm:max-w-md">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Upload Video</h2>
          <button className="text-gray-500" onClick={onClose}>X</button>
        </div>
{!isInstructionDone ? (
  <div className="mt-4 bg-black bg-opacity-70 text-white p-6 rounded-lg">
    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
      <span role="img" aria-label="video">📹</span> Quick Tip for Your Video Walk-Through
    </h3>
    <p className="mb-2">A <strong>1–3 minute video</strong> is required.</p>
    <ul className="list-disc pl-5 space-y-1">
      <li><strong>Focus on key areas:</strong> Entry, Living Room, Kitchen, Bedroom(s), Bathroom(s), and Balcony (if any).</li>
      <li><span role="img" aria-label="target">🎯</span> Helps tenants trust your listing and decide faster.</li>
      <li><span role="img" aria-label="phone">📱</span> Use your phone sideways (landscape)</li>
      <li><span role="img" aria-label="light bulb">💡</span> Ensure good lighting and walk steadily</li>
      <li><strong>Avoid:</strong> blurry shots, shaky hands, or skipping important rooms.</li>
      <li><span role="img" aria-label="check">✅</span> Keep it simple. Show the real space.</li>
    </ul>

    <div className="mt-6">
      <button
        onClick={handleInstructionDone}
        className="w-full bg-white text-black p-2 rounded hover:bg-gray-200 transition"
      >
        Got it – Continue
      </button>
    </div>
  </div>
) : (
  // ...

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">Select Video File</label>
            <input
              type="file"
              accept="video/*"
              onChange={handleVideoChange}
              className="mt-1 p-2 border border-gray-300 rounded w-full"
            />
    {selectedVideo && (
  <div className="mt-4 max-w-full max-h-[150px] overflow-hidden">
    <p className="text-sm font-medium text-gray-600">Selected Video:</p>
    <video
      src={URL.createObjectURL(selectedVideo)}
      controls
      className="w-full h-full object-contain rounded shadow"
    />
  </div>
)}

            <div className="mt-4 flex justify-between">
              <button
                onClick={onClose}
                className="bg-gray-300 text-black p-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!selectedVideo}
                className={`bg-blue-600 text-white p-2 rounded ${!selectedVideo ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Submit Video
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoUploadModal;
