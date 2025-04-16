'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { Spotlight } from './ui/Spotlight';
import { TextGenerateEffect } from './ui/TextGenerateEffect';
import Image from 'next/image';
import MagicButton from './ui/MagicButton';
import { FaLocationArrow } from 'react-icons/fa';
import Link from 'next/link'; // Updated to use Link

const Hero = () => {
  return (
    <div className="relative min-h-screen w-screen dark:bg-black-100 bg-white dark:bg-grid-white/[0.05] bg-grid-black/[0.2]">
      {/* Background styling moved up here */}
      <div className="absolute pointer-events-none inset-0 flex items-center justify-center dark:bg-black-100 bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]">
      </div>
      
      {/* Spotlight backgrounds */}
      <div className='absolute inset-0 pointer-events-none'>
        <Spotlight className="-top-40 -left-10 md:-left-32 md:-top-20 h-screen" fill="purple" />
        <Spotlight className="-top-40 -left-10 md:-left-32 md:-top-20 h-screen" fill="purple" />
        <Spotlight className="top-10 left-full h-[80vh] w-[50vw]" fill="purple" />
        <Spotlight className="top-28 left-80 h-[80vh] md:-left-32 md:-top-20" fill="blue" />
      </div>

      {/* Main Hero Section */}
      <div className="flex justify-center items-center relative top-0 left-0 min-h-[80vh]">
        <div className="flex justify-center relative my-20 z-10">
          <div className="max-w-[100vw] md:max-w-4xl justify-center flex flex-col items-center">
            <motion.div 
              className="w-44 lg:w-56"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 2 }}
            >
            </motion.div>
            <TextGenerateEffect
              className="font-bold text-center text-white text-3xl sm:text-4xl md:text-5xl lg:text-6xl"
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

      {/* Welcome, Landlord Section */}
<div className="flex flex-col lg:flex-row lg:justify-between lg:items-center my-20 z-10 w-full px-4 lg:px-20">
  {/* Text Section */}
  <div className="flex-1 text-center lg:text-left">
    <h1 className="mt-10 text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-gray-500"> Landlord Manager</h1>
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

  {/* Image Section */}
  <div className="flex-1 flex justify-center mt-10 lg:mt-0">
    <Image
      src="/images/hompro79.png"
      alt="Landlord managing properties"
      width={600}
      height={700}
      className="w-[300px] h-[300px] md:w-[550px] md:h-auto"
      priority
    />
  </div>
</div>

    </div>
  );
};

export default Hero;
