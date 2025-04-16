"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios, { AxiosError } from 'axios';
import TypeWriter from './TypeWriter';
import { useUser } from '@/context/UserContext';
import { io } from 'socket.io-client';
import CustomLoading from './Loading';
import { motion } from 'framer-motion'; // Import Framer Motion

interface AuthFormProps {
  mode: 'login' | 'signup';
  isModal?: boolean;
}

const socket = io('http://localhost:4002');

interface User {
  email: string;
  password: string;
  role: string;
  name: string;
}

interface ErrorResponse {
  message: string;
}

const AuthForm: React.FC<AuthFormProps> = ({ mode, isModal = false }) => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002';
  const [user, setUser] = useState<User>({ email: '', password: '', name: '', role: 'LANDLORD' });
  const [isSignUp, setIsSignUp] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const router = useRouter();
  const { setUsername } = useUser();

  useEffect(() => {
    if (mode === 'login') {
      setIsSignUp(false);
    }
  }, [mode]);

  const validateEmail = (email: string): boolean => /\S+@\S+\.\S+/.test(email);
  const validatePassword = (password: string): boolean => /^(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if ((isSignUp && !user.name) || !user.email || !user.password || !user.role) {
      setError('All fields are required.');
      return;
    }

    if (!validateEmail(user.email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!validatePassword(user.password)) {
      setError('Password must be at least 8 characters long and include an uppercase letter and a number.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    const payload = {
      email: user.email,
      password: user.password,
      role: user.role,
      name: user.name,
    };

    try {
      const endpoint = isSignUp ? `${apiUrl}/users` : `${apiUrl}/login`;
      const response = await axios.post(endpoint, payload, {
        withCredentials: true,
      });

      if (isSignUp) {
        setSuccessMessage('A verification email has been sent. Please check your inbox and verify your email before proceeding.');
        setIsSubmitting(false);
        return;
      }

      if (response.data.user.isVerified === false) {
        setError('Please verify your email before logging in. Check your inbox for the verification email.');
        setIsSubmitting(false);
        return;
      }

      const token = response.data.token;
      const userId = response.data.user.id;
      const userRole = response.data.user.role;
      const tenantId = response.data.user.tenantId || null;
      const landlordId = response.data.user.landlordId || null;

      localStorage.setItem('token', token);
      localStorage.setItem('userId', userId);
      localStorage.setItem('userRole', userRole);
      if (tenantId) localStorage.setItem('tenantId', tenantId);
      if (landlordId) localStorage.setItem('landlordId', landlordId);

      setUsername(response.data.user.name);

      socket.emit('userDetails', {
        userId,
        role: userRole,
        tenantId: userRole === 'TENANT' ? tenantId : null,
        landlordId: userRole === 'LANDLORD' ? landlordId : null,
      });

      const redirectPath = userRole === 'LANDLORD' ? '/dashboard/LandlordDashboard' : '/dashboard/TenantDashboard';
      router.push(redirectPath);
    } catch (err) {
      const axiosError = err as AxiosError;

      if (axiosError.response) {
        const errorData = axiosError.response.data as ErrorResponse;

        if (axiosError.response.status === 403) {
          setError('Please verify your email before logging in. Check your inbox for the verification email.');
        } else {
          setError(errorData.message || 'An error occurred. Please try again.');
        }
      } else {
        setError('An error occurred. Please try again.');
      }

      console.error('Submission error:', axiosError);
      setIsSubmitting(false);
    }
  };

  if (isSubmitting) {
    return <CustomLoading />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
      className={`w-full flex ${isModal ? 'flex-col' : 'flex-col lg:flex-row'} items-center justify-center min-h-screen dark:bg-black-100`}
    >
      {!isModal && (
        <div className="w-full lg:w-1/2 hidden lg:block">
          <TypeWriter />
        </div>
      )}

      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4 text-gray-300">
          {isSignUp ? 'Sign Up' : 'Login'}
        </h1>
        <form
          className="bg-transparent border border-gray-500 p-6 rounded shadow-md w-full max-w-sm"
          onSubmit={handleSubmit}
        >
          <label htmlFor="email" className="block text-gray-700">Email</label>
          <input
            name="email"
            type="email"
            placeholder="tobichuks@gmail.com"
            value={user.email}
            onChange={(e) => setUser({ ...user, email: e.target.value })}
            className="bg-transparent outline-none w-full px-4 py-2 border rounded placeholder:text-gray-600 border-gray-600"
          />

          <label htmlFor="password" className="block text-gray-700">Password</label>
          <input
            name="password"
            type="password"
            placeholder="password"
            value={user.password}
            onChange={(e) => setUser({ ...user, password: e.target.value })}
            className=" border-gray-600 bg-transparent outline-none w-full px-4 py-2 border rounded placeholder:text-gray-600"
          />

          {isSignUp && (
            <>
              <label htmlFor="name" className="block text-gray-700">Name</label>
              <input
                name="name"
                type="text"
                placeholder="Tobi Chuks"
                value={user.name}
                onChange={(e) => setUser({ ...user, name: e.target.value })}
                className="bg-transparent outline-none w-full px-4 py-2 border rounded placeholder:text-gray-600"
              />
            </>
          )}

          {isSignUp && (
            <>
              <label htmlFor="role" className="block text-gray-700">Role</label>
              <select
                name="role"
                value={user.role}
                onChange={(e) => setUser({ ...user, role: e.target.value })}
                className="bg-transparent outline-none w-full px-4 py-2 border rounded"
              >
                <option value="LANDLORD">Landlord</option>
                <option value="TENANT">Tenant</option>
              </select>
            </>
          )}

          <button
            type="submit"
            className="mt-6 w-full bg-gradient-to-r from-violet-700 via-black-100 to-violet-700 text-white font-bold py-2 px-4 rounded text-center"
            disabled={isSubmitting}
          >
            {isSignUp ? 'Sign Up' : 'Login'}
          </button>
        </form>

        <p className="mt-4 text-blue-500 ">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}
          <button className="p-[6px] rounded-sm bg-gradient-to-r from-violet-500 via-black-100 to-violet-950 text-white w-16" onClick={() => setIsSignUp(!isSignUp)}>
            {isSignUp ? 'Login' : 'SignUp'}
          </button>
        </p>

        {error && <p className="text-red-500">{error}</p>}
        {successMessage && <p className="text-green-600">{successMessage}</p>}
      </div>
    </motion.div>
  );
};

export default AuthForm;
