import React from 'react'
import LandlordWelcomePage from '@/components/LandlordWelcomePage'
import { ThemeProvider } from 'next-themes'
import '../styles/globals.css';
const landlordwelcome = () => {
  return (
     <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
		  <div className="w-full bg-black-100 relative flex justify-center items-center min-h-screen flex-col sm:px-10 px-4 py-8 pt-10 overflow-clip ">
    
          <LandlordWelcomePage/>

   </div>
     </ThemeProvider>
  )
}

export default landlordwelcome