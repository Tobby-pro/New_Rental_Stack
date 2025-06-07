import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/Dashboard/DashboardLayout';
import { UserProvider } from '@/context/UserContext';

// Placeholder components – to be implemented
import ServiceStats from '@/components/ServiceProvider/ServiceStats';
import ServiceList from '@/components/ServiceProvider/ServiceList';
import AddServiceModal from '@/components/ServiceProvider/AddServiceModal';

const ServiceProviderDashboardContent = () => {
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    document.body.classList.add('bg-black-100');
    return () => {
      document.body.classList.remove('bg-black-100');
    };
  }, []);

  return (
    <div className="mt-4 min-h-screen relative flex flex-col justify-center py-10 w-full
      dark:bg-black-100 bg-black-100 dark:bg-grid-white/[0.05] bg-grid-black/[0.4] items-center text-white">
      
      {/* Background Glow */}
      <div className="absolute pointer-events-none inset-0 flex justify-center
        dark:bg-black-100 bg-black-100 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]">
      </div>

      {/* Service Stats Summary (e.g., jobs completed, revenue) */}
      <ServiceStats />

      {/* List of services offered */}
      <ServiceList setModalOpen={setModalOpen} />

      {/* Modal for adding a new service */}
      {modalOpen && <AddServiceModal setModalOpen={setModalOpen} />}
    </div>
  );
};

const ServiceProviderDashboard = () => {
  return (
    <UserProvider>
      <DashboardLayout>
        <ServiceProviderDashboardContent />
      </DashboardLayout>
    </UserProvider>
  );
};

export default ServiceProviderDashboard;
