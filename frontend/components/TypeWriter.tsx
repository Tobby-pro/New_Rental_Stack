import React from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the Typewriter component with server-side rendering disabled
const Typewriter: any = dynamic(() => import('react-typewriter-effect'), { ssr: false });

const TypewriterComponent: React.FC = () => {
  return (
    <div className="hidden lg:flex w-full lg:w-1/2 items-center justify-center">
      <div className="text-5xl font-bold text-violet-500 max-w-full whitespace-nowrap">
        <Typewriter
          multiText={[
            'Welcome Landlords and Tenants',
            'Connecting Homes and People',
            'Find Your Perfect Rental Match'
          ]}
          multiTextDelay={1000}
          typeSpeed={50}
          multiTextLoop
          cursorColor="#3F3D56"
        />
      </div>
    </div>
  );
};

export default TypewriterComponent;
