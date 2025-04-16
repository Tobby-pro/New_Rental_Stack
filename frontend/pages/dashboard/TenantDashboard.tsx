import React, { useState } from 'react';
import DashboardLayout from '../../components/Dashboard/DashboardLayout';
import { UserProvider, useUser } from '@/context/UserContext'; // Adjust the path as necessary
import Search from '../search';

const TenantDashboardContent = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const { users } = useUser(); // Get users from UserContext
  return (
   <DashboardLayout setModalOpen={setModalOpen}>
      <div className="mt-6 min-h-screen bottom-0 relative flex flex-col justify-center py-8 w-full">
         <Search />
      </div>
    </DashboardLayout>
  );
};

const TenantDashboard = () => {
  return (
    <UserProvider>
      <TenantDashboardContent />
    </UserProvider>
  );
};

export default TenantDashboard;
