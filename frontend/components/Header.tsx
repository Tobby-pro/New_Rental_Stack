'use client'
import React from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const Header = () => {
  const router = useRouter()

  return (
    <header className="fixed top-0 w-full z-50 h-16 backdrop-blur-md bg-opacity-50">
      <nav className="flex items-center justify-between h-full px-4 lg:px-8">
        {/* Left side - Logo */}
        <div className="flex items-center flex-1">
          <Link href="/">
            <Image
              src="/images/jun7_03.png"
              alt="bluntrent"
              width={60}
              height={60}
              priority
            />
          </Link>
        </div>

        {/* Right side - Sign Up and Login Buttons */}
        <div className="flex items-center space-x-4">
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

export default Header
