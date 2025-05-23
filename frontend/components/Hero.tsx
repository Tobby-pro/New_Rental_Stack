'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { Spotlight } from './ui/Spotlight';
import { TextGenerateEffect } from './ui/TextGenerateEffect';
import Image from 'next/image';
import MagicButton from './ui/MagicButton';
import { FaLocationArrow } from 'react-icons/fa';
import Link from 'next/link';
import Footer from './Footer';

const Hero = () => {
  return (
    <div className="relative mt-10 min-h-screen w-screen dark:bg-black-100 bg-white dark:bg-grid-white/[0.05] bg-grid-black/[0.2]">
      
      {/* Background styling */}
      <div className="absolute pointer-events-none inset-0 flex items-center justify-center dark:bg-black-100 bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
      
      {/* Spotlight background effects */}
      <div className='absolute inset-0 pointer-events-none'>
        <Spotlight className="-top-40 -left-10 md:-left-32 md:-top-20 h-screen" fill="purple" />
        <Spotlight className="-top-40 -left-10 md:-left-32 md:-top-20 h-screen" fill="purple" />
        <Spotlight className="top-10 left-full h-[80vh] w-[50vw]" fill="purple" />
        <Spotlight className="top-28 left-80 h-[80vh] md:-left-32 md:-top-20" fill="blue" />
      </div>

      {/* Hero section */}
      <div className="flex justify-center items-center relative top-0 left-0 min-h-[80vh]">
        <div className="flex justify-center relative mt-0 z-10">
          <div className="max-w-[100vw] md:max-w-4xl justify-center flex flex-col items-center">
            
            <motion.div 
              className="w-44 lg:w-56"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 2 }}
            />
            
            <TextGenerateEffect
              className="font-bold text-center text-gray-500 text-3xl sm:text-4xl md:text-5xl lg:text-6xl"
              words="Home Connections Made Simple, Connecting Renters and Providers"
            />
            <TextGenerateEffect
              className="text-center md:tracking-wider mb-4 text-sm"
              words="Explore homes with ease, Discover Homes in Your Preferred Area."
            />
            
            <motion.div 
              className="w-44 lg:w-56"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 7 }}
            >
              <Link href="LandlordSignUp">
                <MagicButton
                  title="Get Started"
                  icon={<FaLocationArrow color="blue" />}
                  position={'right'}
                />
              </Link>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Landlord Manager Section */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mt-[-1vh] z-10 w-full px-4 lg:px-20">
        <div className="flex-1 text-center lg:text-left">
          <h1 className="mt-10 text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-gray-500">Landlord Manager</h1>
          <p className="text-base md:text-lg lg:text-xl mb-4">Manage your properties with ease and connect with tenants directly through our platform.</p>
          <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold mb-4 text-gray-500">Why Use Our Platform?</h2>
          <ul className="text-sm md:text-lg lg:text-xl list-disc list-inside text-left mb-4">
            <li>Easy property management</li>
            <li>Direct communication with tenants</li>
            <li>Streamlined maintenance requests</li>
            <li>And much more!</li>
          </ul>
          <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold mb-4 text-gray-500">How It Works</h2>
          <p className="mb-2 text-sm md:text-lg">1. Sign up or log in to your account.</p>
          <p className="mb-2 text-sm md:text-lg">2. Add your properties.</p>
          <p className="mb-2 text-sm md:text-lg">3. Connect with tenants and manage everything from your dashboard.</p>
        </div>

        <div className="flex-1 flex justify-center mt-10 lg:mt-0">
          <Image
            src="/images/blackjoy06.png"
            alt="Landlord managing properties"
            width={700}
            height={800}
            className="w-[500px] h-[auto] md:w-[550px] md:h-auto"
            priority
          />
        </div>
      </div>

      {/* Live Tour Feature Section */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center my-32 z-10 w-full px-4 lg:px-20">
        
        {/* Live Image */}
        <div className="flex-1 flex justify-center mb-10 lg:mb-0">
          <Image
            src="/images/chatpanel01.png"  // Change to your actual image
            alt="Live property tour"
            width={700}
            height={800}
            className="w-[600px] h-[auto] md:w-[550px] md:h-auto"
            priority
          />
        </div>

        {/* Live Text Content */}
        <div className="flex-1 text-center lg:text-left">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-500">Go Live with Property Tours</h2>
          <p className="text-base md:text-lg mb-4">
            Landlords can now host live video tours of their properties, showcasing details in real time. No need to pre-record or upload videos — just go live!
          </p>
          <h3 className="text-xl font-semibold mb-2">Tenants Can:</h3>
          <ul className="text-sm md:text-lg list-disc list-inside text-left mb-4">
            <li>Join live sessions instantly from anywhere</li>
            <li>Interact and ask questions in real-time</li>
            <li>Book a live schedule in advance</li>
          </ul>
          <p className="text-sm md:text-lg">
            Whether it's a spontaneous showing or a scheduled virtual tour, everyone stays connected and informed.
          </p>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Hero;
