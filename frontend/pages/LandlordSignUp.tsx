import React from 'react'
import { ThemeProvider } from 'next-themes'
import AuthForm from '@/components/AuthFormpage'
import { UserProvider } from '@/context/UserContext'; // Import UserProvider
import '../styles/globals.css';
import AuthModal from '@/components/AuthModal';


const LandLordSignUp = () => {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <UserProvider> {/* Wrap the AuthForm with UserProvider */}
        <div className="w-full bg-black-100 relative flex justify-center items-center min-h-screen flex-col  overflow-clip">
          <AuthForm mode={'login'} />
          
        </div>
      </UserProvider>
    </ThemeProvider>
  )
}

export default LandLordSignUp;
