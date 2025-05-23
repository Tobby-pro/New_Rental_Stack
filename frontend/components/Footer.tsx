import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-black text-white py-8 px-4 text-center">
      <div className="max-w-6xl mx-auto">
        <p className="text-sm md:text-base">&copy; {new Date().getFullYear()} HomeConnect. All rights reserved.</p>
        <p className="text-xs mt-2">Built with ❤️ for landlords and tenants</p>
      </div>
    </footer>
  );
};

export default Footer;
