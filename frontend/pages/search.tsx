import Search from '@/components/Search';
import { ThemeProvider } from 'next-themes';
import '@/styles/globals.css';
import { FloatingNav } from '@/components/ui/FloatingNav';
import { FaHome } from 'react-icons/fa';
import { UserProvider } from '@/context/UserContext'; // <-- import it
import Header from '@/components/Header';

type SearchPageProps = {
  searchParams?: {
    query?: string;
  };
};

const SearchPage = ({ searchParams }: SearchPageProps) => {
  const query = searchParams?.query || '';
  console.log("query", query);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <UserProvider> 
        <div className="w-full bg-black-100 relative flex min-h-screen items-center justify-center flex-col sm:px-10 px-5 py-8 pt-10 overflow-clip">
          <FloatingNav navItems={[{ name: "Home", link: "/", icon: <FaHome /> }]} />
          <Search />
        </div>
      </UserProvider>
    </ThemeProvider>
  );
};

export default SearchPage;
