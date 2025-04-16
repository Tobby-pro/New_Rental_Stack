import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/Dashboard/DashboardLayout';
import { UserProvider, useUser } from '@/context/UserContext'; // Adjust the path as necessary
import LandlordDashboardGrid from '@/components/LandlordDashboardgrid';
import MyPropertyList from '@/components/MyPropertyList';
import AddPropertyModal from '@/components/AddProperty';
import axios, { AxiosError } from 'axios'; 
interface LandlordDashboardGridProps {
  className?: string;
  setModalOpen: (value: boolean) => void;
}
interface ErrorResponse {
  message: string;
  // Add additional API response fields as needed
}

const LandlordDashboardContent = () => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
 const [error, setError] = useState<string | null>(null); // Error state
  const [alertMessage, setAlertMessage] = useState<string | null>(null); // ✅


  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002'; // API URL
  const handleSubmit = async (formData: FormData) => {
  if (
    !formData.get('address') ||
    !formData.get('city') ||
    !formData.get('state') ||
    !formData.get('price') ||
    formData.getAll('media').length === 0
  ) {
    setError('All fields, including media (images or videos), are required.');
    return;
  }

  setIsSubmitting(true);
  setError(null);

  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Authentication token is missing. Please login again.');

    const response = await axios.post(`${apiUrl}/api/properties`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}`,
      },
    });

    const { landlordId } = response.data;
    localStorage.setItem('landlordId', landlordId);
    setAlertMessage('Property added successfully!');
    setModalOpen(false);
  } catch (err: any) {
    const axiosError = err as AxiosError<ErrorResponse>;
    if (axiosError.response) {
      setError(axiosError.response.data.message || 'An error occurred. Please try again.');
    } else {
      setError(err.message || 'An error occurred. Please try again.');
    }
    setModalOpen(true);
  } finally {
    setIsSubmitting(false);
  }
};


  useEffect(() => {
    // Add Tailwind class for background color when the component mounts
    document.body.classList.add('bg-black-100');

    // Clean up the background class when the component unmounts
    return () => {
      document.body.classList.remove('bg-black-100');
    };
  }, []);

  const { users } = useUser(); // Get users from UserContext

  return (
    <DashboardLayout setModalOpen={() => {}}>
      <div className="mt-4 min-h-screen relative flex flex-col justify-center py-10 w-full
        dark:bg-black-100 bg-black-100 dark:bg-grid-white/[0.05] bg-grid-black/[0.4] items-center text-white"> {/* Explicitly set text to white */}
        
        <div className="absolute pointer-events-none inset-0 flex justify-center
          dark:bg-black-100 bg-black-100 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]">
        </div>

        {/* Ensure these components render text in white */}
        <LandlordDashboardGrid className="text-white" setModalOpen={setModalOpen} /> 
        <MyPropertyList className="text-white" />

        {isModalOpen && (
          <AddPropertyModal
            isOpen={isModalOpen}
            onClose={() => setModalOpen(false)}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            error={error}
            setAlertMessage={setAlertMessage}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

const LandlordDashboard = () => {
  return (
    <UserProvider>
      <LandlordDashboardContent />
    </UserProvider>
  );
};

export default LandlordDashboard;
