import React from 'react';

const CustomLoading = () => {
  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center gap-6">
      {/* Home Logo + Sliding Dots */}
      <div className="flex items-center gap-3">
        <img
          src="/images/drent.png"
          alt="Loading"
          className="h-8 w-8"
        />
        <div className="flex gap-1 relative w-12 h-3 overflow-hidden">
          <span className="w-2 h-2 bg-gray-700 rounded-full absolute animate-slide-dot left-0"></span>
          <span className="w-2 h-2 bg-gray-700 rounded-full absolute animate-slide-dot left-3 [animation-delay:0.15s]"></span>
          <span className="w-2 h-2 bg-gray-700 rounded-full absolute animate-slide-dot left-6 [animation-delay:0.3s]"></span>
        </div>
      </div>
    </div>
  );
};

export default CustomLoading;
