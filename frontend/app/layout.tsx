// app/layout.tsx
import { Inter } from 'next/font/google';
import ThemeWrapper from './ThemeWrapper';
import { UserProvider } from '@/context/UserContext';
import Header from '@/components/Header';
import AuthModalWrapper from '@/components/AuthModalWrapper'; // 👈 use wrapper
import '@/styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'dirent',
  description:
    'Experience a stress-free rental search. Our app connects you directly with landlords, offering transparent listings and secure communication. Find your perfect place, the simple and efficient way.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <UserProvider>
          <ThemeWrapper
            attribute="class"
            defaultTheme="dark"
            enableSystem={true}
            disableTransitionOnChange={true}
          >
            <Header />
            <AuthModalWrapper /> {/* 👈 moved Suspense+Modal into a client wrapper */}
            {children}
          </ThemeWrapper>
        </UserProvider>
      </body>
    </html>
  );
}
