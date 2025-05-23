"use client";

import React, { useEffect, useState } from 'react';
import Joyride, { CallBackProps, STATUS, Step, Styles } from 'react-joyride';

export type TourGuideProps = {
  run: boolean;
  steps: Step[];
  onTourEnd?: () => void;
};

const customStyles: Partial<Styles> = {
  options: {
    zIndex: 9999,
    primaryColor: '#3b82f6', // Tailwind blue-500
    backgroundColor: '#ffffff',
    textColor: '#111827', // Tailwind gray-900
    arrowColor: '#ffffff',
    overlayColor: 'rgba(0, 0, 0, 0.5)',
    spotlightShadow: '0 0 0 3px rgba(59,130,246,0.4)',
  },
};

const TourGuide: React.FC<TourGuideProps> = ({ run, steps, onTourEnd }) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true); // Prevent SSR issues
  }, []);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    if ((status === STATUS.FINISHED || status === STATUS.SKIPPED) && onTourEnd) {
      
      onTourEnd();
    }
  };

  if (!isClient) return null;

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      scrollToFirstStep
      showSkipButton
      showProgress
      disableOverlayClose
      callback={handleJoyrideCallback}
      styles={customStyles}
    />
  );
};

export default TourGuide;
