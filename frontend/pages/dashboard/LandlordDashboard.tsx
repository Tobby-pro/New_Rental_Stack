import React, { useEffect } from 'react';
import DashboardLayout from '../../components/Dashboard/DashboardLayout';
import { UserProvider } from '@/context/UserContext';
import LandlordDashboardGrid from '@/components/LandlordDashboardgrid';
import MyPropertyList from '@/components/MyPropertyList';
import PublicServiceList from '@/components/PublicServiceList';

const LandlordDashboardContent = ({ setModalOpen }: { setModalOpen?: (value: boolean) => void }) => {
  useEffect(() => {
    document.body.classList.add('bg-black-100');
    return () => {
      document.body.classList.remove('bg-black-100');
    };
  }, []);

  return (
    <div className="mt-4 min-h-screen relative flex flex-col justify-center py-10 w-full
      dark:bg-black-100 bg-black-100 dark:bg-grid-white/[0.05] bg-grid-black/[0.4] items-center text-white">
      
      <div className="absolute pointer-events-none inset-0 flex justify-center
        dark:bg-black-100 bg-black-100 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]">
      </div>

      <LandlordDashboardGrid className="text-white" setModalOpen={setModalOpen ?? (() => {})} />
      <MyPropertyList className="text-white" />
      <PublicServiceList />
    </div>
  );
};

const LandlordDashboard = () => {
  return (
    <UserProvider>
      <DashboardLayout>
        <LandlordDashboardContent />
      </DashboardLayout>
    </UserProvider>
  );
};

export default LandlordDashboard;
