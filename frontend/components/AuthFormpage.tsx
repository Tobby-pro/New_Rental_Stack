"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios, { AxiosError } from 'axios';
import TypeWriter from './TypeWriter';
import { useUser } from '@/context/UserContext';
import { io } from 'socket.io-client';
import CustomLoading from './Loading';
import { motion } from 'framer-motion';

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
  const [emailLink, setEmailLink] = useState<string | null>(null);
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

  const getEmailProviderLink = (email: string): string | null => {
    const domain = email.split('@')[1]?.toLowerCase();
    if (domain.includes('gmail')) return 'https://mail.google.com/';
    if (domain.includes('yahoo')) return 'https://mail.yahoo.com/';
    if (domain.includes('outlook') || domain.includes('hotmail')) return 'https://outlook.live.com/';
    return null;
  };

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
    setEmailLink(null);

    const payload = {
      email: user.email,
      password: user.password,
      role: user.role,
      name: user.name,
    };

    try {
      const endpoint = isSignUp ? `${apiUrl}/users` : `${apiUrl}/login`;
      const response = await axios.post(endpoint, payload, { withCredentials: true });

      if (isSignUp) {
        const link = getEmailProviderLink(user.email);
        setSuccessMessage('Signup successful. Please verify your email.');
        if (link) setEmailLink(link);
        setIsSubmitting(false);
        return;
      }

      if (response.data.user.isVerified === false) {
        const link = getEmailProviderLink(response.data.user.email);
        setError('Please verify your email before logging in.');
        if (link) setEmailLink(link);
        setIsSubmitting(false);
        return;
      }

      const token = response.data.token;
      const userId = response.data.user.id;
      const userRole = response.data.user.role;
      const tenantId = response.data.user.tenantId || null;
      const landlordId = response.data.user.landlordId || null;
      const serviceProviderId = response.data.user.serviceProviderId || null;

      localStorage.setItem('token', token);
      localStorage.setItem('userId', userId);
      localStorage.setItem('userRole', userRole);
      if (tenantId) localStorage.setItem('tenantId', tenantId);
      if (landlordId) localStorage.setItem('landlordId', landlordId);
      if (serviceProviderId) localStorage.setItem('serviceProviderId', serviceProviderId);

      setUsername(response.data.user.name);

      socket.emit('userDetails', {
        userId,
        role: userRole,
        tenantId: userRole === 'TENANT' ? tenantId : null,
        landlordId: userRole === 'LANDLORD' ? landlordId : null,
        serviceProviderId: userRole === 'SERVICE_PROVIDER' ? serviceProviderId : null,
      });

      let redirectPath = '/dashboard';
      if (userRole === 'LANDLORD') redirectPath = '/dashboard/LandlordDashboard';
      else if (userRole === 'TENANT') redirectPath = '/dashboard/TenantDashboard';
      else if (userRole === 'SERVICE_PROVIDER') redirectPath = '/dashboard/ServiceProviderDashboard';

      router.push(redirectPath);
    } catch (err) {
      const axiosError = err as AxiosError;
      if (axiosError.response) {
        const errorData = axiosError.response.data as ErrorResponse;
        if (axiosError.response.status === 403) {
          setError('Please verify your email before logging in.');
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

  if (isSubmitting) return <CustomLoading />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
      className={`relative w-full flex ${isModal ? 'flex-col' : 'flex-col lg:flex-row'} items-center justify-center min-h-screen dark:bg-black-100`}
    >
      {!isModal && (
        <>
          {/* Background Image */}
          <div className="absolute top-0 left-0 w-full h-64 lg:h-full lg:w-1/2 z-0">
            <img
              src="images/nito01.png"
              alt="Background"
              className="object-cover w-full h-full opacity-40"
            />
          </div>

          {/* Typewriter Text in Front */}
          <div className="relative w-full lg:w-1/2 z-10 flex items-center justify-center py-10">
            <TypeWriter />
          </div>
        </>
      )}

      <div className="relative z-10 w-full lg:w-1/2 flex flex-col items-center justify-center px-4">
        <h1 className="text-2xl font-bold mb-4 text-gray-500">
          {isSignUp ? 'Sign Up' : 'Login'}
        </h1>
        <form onSubmit={handleSubmit} className="bg-transparent border border-gray-500 p-6 rounded-xl shadow-md w-full max-w-sm">
          <label htmlFor="email" className="block text-sm text-gray-700">Email</label>
          <input
            name="email"
            type="email"
            placeholder="tobichuks@gmail.com"
            value={user.email}
            onChange={(e) => setUser({ ...user, email: e.target.value })}
            className="bg-transparent outline-none w-full px-4 py-2 border placeholder:text-sm rounded placeholder:text-gray-600 border-gray-600 text-gray-300"
          />

          <label htmlFor="password" className="block text-sm text-gray-700">Password</label>
          <input
            name="password"
            type="password"
            placeholder="password"
            value={user.password}
            onChange={(e) => setUser({ ...user, password: e.target.value })}
            className="text-gray-300 border-gray-600 bg-transparent outline-none placeholder:text-sm w-full px-4 py-2 border rounded placeholder:text-gray-600"
          />

          {isSignUp && (
            <>
              <label htmlFor="name" className="block text-sm text-gray-700">Name</label>
              <input
                name="name"
                type="text"
                placeholder="Jesse peter"
                value={user.name}
                onChange={(e) => setUser({ ...user, name: e.target.value })}
                className="text-gray-300 border-gray-600 placeholder:text-sm bg-transparent outline-none w-full px-4 py-2 border rounded placeholder:text-gray-600"
              />

              <label htmlFor="role" className="block text-sm text-gray-700">Role</label>
              <select
                name="role"
                value={user.role}
                onChange={(e) => setUser({ ...user, role: e.target.value })}
                className="text-gray-300 border-gray-600 text-sm placeholder:text-sm bg-transparent outline-none w-full px-4 py-2 border rounded"
              >
                <option value="LANDLORD">Landlord</option>
                <option value="TENANT">Tenant</option>
                <option value="SERVICE_PROVIDER">Service Provider</option>
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

        <p className="mt-4 text-blue-500">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}
          <button
            className="p-[6px] ml-2 rounded-sm bg-gradient-to-r from-violet-500 via-black-100 to-violet-950 text-white w-16"
            onClick={() => setIsSignUp(!isSignUp)}
          >
            {isSignUp ? 'Login' : 'SignUp'}
          </button>
        </p>

        {error && (
          <p className="text-red-500 mt-2">
            {error}
            {emailLink && (
              <span>
                {' '}👉{' '}
                <a href={emailLink} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline hover:text-blue-700">
                  Open your mail
                </a>
              </span>
            )}
          </p>
        )}

        {successMessage && (
          <p className="text-green-600 mt-2">{successMessage}</p>
        )}
      </div>
    </motion.div>
  );
};

export default AuthForm;
