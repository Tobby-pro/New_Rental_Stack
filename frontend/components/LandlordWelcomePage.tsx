'use client'
import React from 'react'
import Link from 'next/link';
import {motion} from 'framer-motion'
import { AiOutlineArrowLeft } from 'react-icons/ai';
import LandlordSignup from './AuthFormpage';
import LandlordSignupPage from './AuthFormpage';

const LandlordWelcomePage = () => {
 return (

    <div className=" text-violet-400 relative flex lg:flex-row flex-col items-center p-6 justify-between min-h-screen h-screen w-full dark:bg-black-100  bg-white dark:bg-grid-white/[0.05] bg-grid-black/[0.2] ">
      <div className="m-2 flex items-center flex-col">

      <Link href="/" className="absolute top-6 left-6">
        <AiOutlineArrowLeft size={24} />
      </Link>
      <div className="absolute top-6 right-6 flex space-x-4">
        <Link href="/LandlordSignUp" className="text-amber-500 hover:text-blue-500">Sign Up</Link>
         <Link href="/LandlordSignUp?mode=login" className="text-amber-500 hover:text-blue-500">Login</Link> {/* Updated with query param */}
      </div>
      <h1 className="mt-10 lg:text-5xl text-4xl font-bold mb-6 text-gray-500"> Landlord Manager</h1>
      <p className="lg:text-xl mb-4 text-center">Manage your properties with ease and connect with tenants directly through our platform.</p>
    
      <div className="max-w-3xl text-center">
        <h2 className="lg:text-3xl text-2xl font-semibold mb-4 text-gray-500">Why Use Our Platform?</h2>
        <ul className="lg:text-xl list-disc list-inside text-left mb-4">
          <li>Easy property management</li>
          <li>Direct communication with tenants</li>
          <li>Streamlined maintenance requests</li>
          <li>And much more!</li>
        </ul>
        <h2 className="lg:text-3xl text-2xl font-semibold mb-4 text-gray-500">How It Works</h2>
        <p className="mb-2 text-xl">1. Sign up or log in to your account.</p>
        <p className="mb-2 text-xl">2. Add your properties.</p>
        <p className="mb-2 text-xl">3. Connect with tenants and manage everything from your dashboard.</p>
      </div>
       </div>
       <div className=' bg-white dark:bg-grid-white/[0.05] bg-grid-black/[0.2]'>
            
       </div>
    </div>
  );
}

export default LandlordWelcomePage