"use client";
import { SignIn } from "@clerk/nextjs";
export default function Page() {

  return (
    <div className="flex w-screen h-screen">
      {/* Left Column (62%) */}
      <div className="w-[62%] h-full relative overflow-hidden bg-[#0a1628]">
        <svg viewBox="0 0 760 700" preserveAspectRatio="xMidYMid slice" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c8e6f7"/>
              <stop offset="55%" stopColor="#4a7ab5"/>
              <stop offset="100%" stopColor="#133255"/>
            </linearGradient>
            <linearGradient id="seaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#133255"/>
              <stop offset="100%" stopColor="#06162e"/>
            </linearGradient>
            <linearGradient id="snowGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f0f7ff"/>
              <stop offset="100%" stopColor="#d0e8f5"/>
            </linearGradient>
            <linearGradient id="rayGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2a6db5" stopOpacity="0.6"/>
              <stop offset="100%" stopColor="#133255" stopOpacity="0"/>
            </linearGradient>
            <clipPath id="skyClip"><rect x="0" y="0" width="760" height="350"/></clipPath>
            <clipPath id="seaClip"><rect x="0" y="350" width="760" height="350"/></clipPath>
          </defs>
          <rect x="0" y="0" width="760" height="350" fill="url(#skyGrad)"/>
          <polygon points="380,60 180,350 580,350" fill="#2a4a6e" clipPath="url(#skyClip)"/>
          <polygon points="380,60 300,200 460,200" fill="url(#snowGrad)" clipPath="url(#skyClip)"/>
          <polygon points="250,350 180,270 320,350" fill="#1e3a5e" clipPath="url(#skyClip)"/>
          <polygon points="510,350 580,270 440,350" fill="#1e3a5e" clipPath="url(#skyClip)"/>
          <rect x="0" y="350" width="760" height="350" fill="url(#seaGrad)"/>
          <ellipse cx="380" cy="350" rx="340" ry="6" fill="rgba(255,255,255,0.15)"/>
          <line x1="0" y1="350" x2="760" y2="350" stroke="rgba(255,255,255,0.35)" strokeWidth="2"/>
          <polygon points="380,640 180,350 580,350" fill="#0d2a56" clipPath="url(#seaClip)" opacity="0.9"/>
          <polygon points="380,350 330,680 380,680" fill="url(#rayGrad)" opacity="0.3"/>
          <polygon points="380,350 280,680 330,680" fill="url(#rayGrad)" opacity="0.2"/>
          <polygon points="380,350 430,680 480,680" fill="url(#rayGrad)" opacity="0.2"/>
          <polygon points="380,350 230,680 280,680" fill="url(#rayGrad)" opacity="0.12"/>
          <polygon points="380,350 480,680 530,680" fill="url(#rayGrad)" opacity="0.12"/>
          <circle cx="120" cy="80" r="1.5" fill="rgba(255,255,255,0.7)"/>
          <circle cx="200" cy="50" r="1" fill="rgba(255,255,255,0.5)"/>
          <circle cx="600" cy="70" r="1.5" fill="rgba(255,255,255,0.6)"/>
          <circle cx="680" cy="100" r="1" fill="rgba(255,255,255,0.5)"/>
          <circle cx="500" cy="40" r="2" fill="rgba(255,255,255,0.8)"/>
          <circle cx="160" cy="140" r="1" fill="rgba(255,255,255,0.4)"/>
          <circle cx="640" cy="150" r="1" fill="rgba(255,255,255,0.4)"/>
        </svg>
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
