import Image from "next/image";

export default function UnderDevelopment() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      <div className="max-w-md w-full text-center space-y-10 flex flex-col items-center">
        <Image 
          src="/Mauna Kea Header.jpeg" 
          alt="Mauna Kea" 
          width={400}
          height={100}
          className="mx-auto mix-blend-multiply opacity-90 h-16 w-auto object-contain" 
          priority
        />
        
        <div className="space-y-4">
          <h1 className="text-2xl sm:text-[28px] font-serif italic text-gray-800 font-light">
            Under Development
          </h1>
          
        </div>
        
        <div className="w-12 h-px bg-gray-300 mx-auto" />
      </div>
    </div>
  );
}
