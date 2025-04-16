import React, { useState, ChangeEvent } from "react";

type ProfilePicUploaderProps = {
  currentUrl?: string;
  onUpload: (url: string) => void;
};

const ProfilePicUploader: React.FC<ProfilePicUploaderProps> = ({
  currentUrl,
  onUpload,
}) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type.startsWith("image/")) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    } else {
      alert("Please select a valid image file (jpg, png, etc.)");
    }
  };

  const handleUpload = async () => {
    if (!file) return alert("No file selected.");

    const formData = new FormData();
    formData.append("avatar", file);

    setUploading(true);
    try {
      const res = await fetch("/api/upload-profile-pic", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        onUpload(data.url);
      } else {
        console.error(data.error);
        alert("Upload failed.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred during upload.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4 p-4 bg-white rounded-xl shadow-md w-full max-w-sm mx-auto">
      <h3 className="text-lg font-semibold text-gray-700">Change Profile Picture</h3>

      <img
        src={preview || currentUrl || "/default-avatar.png"}
        alt="Profile Preview"
        className="w-24 h-24 rounded-full object-cover border mb-4"
      />

      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold
                   file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 mb-4"
      />

      <button
        onClick={handleUpload}
        disabled={uploading}
        className={`px-4 py-2 rounded-lg text-white font-medium transition ${
          uploading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {uploading ? "Uploading..." : "Upload"}
      </button>
    </div>
  );
};

export default ProfilePicUploader;
