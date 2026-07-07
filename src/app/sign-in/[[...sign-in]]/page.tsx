"use client";
import { SignIn } from "@clerk/nextjs";
export default function Page() {

  return (
    <div className="flex w-screen h-screen">
      {/* Left Column (62%) */}
      <div className="w-[62%] h-full relative overflow-hidden bg-[#0a1628]">
        <img src="/login-bg.jpg" alt="Mauna Kea Background" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute bottom-8 left-8 text-white flex flex-col items-center">
          <div className="font-serif text-[19px] font-bold tracking-[1px]">MAUNA KEA</div>
          <div className="text-[12px] tracking-[3px] text-white/65 mt-1">EXECUTIVE SEARCH & ADVISORY</div>
        </div>
      </div>

      {/* Right Column (38%) */}
      <div className="w-[38%] h-full bg-white flex flex-col items-center justify-center overflow-y-auto">
        <div className="w-full max-w-[400px] flex flex-col">
          <div className="mb-8 w-full flex justify-center">
            <img src="/mk_header.jpeg" alt="Mauna Kea International" className="w-full max-w-[280px] h-auto object-contain" />
          </div>
          
          <SignIn 
            path="/sign-in" 
            routing="path" 
            signUpUrl="/sign-up" 
            forceRedirectUrl="/dashboard" 
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-none w-full bg-transparent p-0",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton: "h-[44px] border-[1.5px] border-[#D1D5DB] rounded-md hover:bg-[#f5f5f5]",
                formFieldLabel: "text-[14px] font-semibold text-[#444] uppercase tracking-[0.5px]",
                formFieldInput: "h-[42px] border-[1.5px] border-[#D4E0F0] rounded-md focus:border-[#133255]",
                formButtonPrimary: "h-[44px] bg-[#133255] hover:bg-[#0e3178] rounded-md text-[17px] font-semibold tracking-[0.3px]"
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
