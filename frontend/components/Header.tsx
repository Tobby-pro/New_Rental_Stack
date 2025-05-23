'use client'
import React from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'; // Import useRouter
import Link from 'next/link';

const Header = () => {
  const router = useRouter(); // Initialize router

  return (
    <header className="fixed top-0 w-full z-50 h-14 backdrop-blur-md bg-opacity-50">
      <nav className="flex items-center justify-between p-4 lg:p-8">
        {/* Left side - Logo */}
        <div className="flex flex-1">
          <Link href="">
            <Image
              src="/images/dirent_transparent.svg"
              alt="bluntrent"
              width={100}
              height={100}
              priority
            />
          </Link>
        </div>

        {/* Right side - Sign Up and Login Buttons */}
        <div className="space-x-4">
          <button
            onClick={() => router.push('/?mode=signup')}
            className="text-gray-500 hover:text-blue-500"
          >
            Sign Up
          </button>
          <button
            onClick={() => router.push('/?mode=login')}
            className="text-gray-500 hover:text-blue-500"
          >
            Login
          </button>
        </div>
      </nav>
    </header>
  )
}

export default Header;
