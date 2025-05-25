'use client';
import { useEffect, useState } from 'react';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import AuthForm from './AuthFormpage';

const AuthModal = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const mode = searchParams?.get('mode'); // 'login' or 'signup'

  useEffect(() => {
    setIsOpen(mode === 'login' || mode === 'signup');
  }, [mode]);

  const closeModal = () => {
    setIsOpen(false);
    router.push(pathname || '/'); // Remove the query and go back to home or current page
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-black p-6 rounded-lg w-full max-w-lg relative">
        <button onClick={closeModal} className="absolute top-2 right-2 text-red-500 text-xl">
          &times;
        </button>
        {/* Pass 'mode' to AuthForm */}
        {mode && <AuthForm mode={mode as 'login' | 'signup'} isModal />}
      </div>
    </div>
  );
};

export default AuthModal;
