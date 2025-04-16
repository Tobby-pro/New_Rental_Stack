
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import { FloatingNav } from "@/components/ui/FloatingNav";

export default function Home() {
  return (
	  <main className=" w-screen relative flex min-h-screen flex-col items-center justify-center mx-auto sm:px-10  px-10 overflow-clip min-w-screen">
		  <div className="px-10">
			<Header/>
		<Hero />
			  
			 
		  </div>
		  
    </main>
  );
}
