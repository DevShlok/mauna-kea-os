"use client";
import { SignIn } from "@clerk/nextjs";
import { useState } from "react";

export default function Page() {
  const [tab, setTab] = useState<"team" | "candidate">("team");

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
        <div className="absolute bottom-8 left-8 text-white">
          <div className="font-serif text-[19px] font-bold tracking-[1px]">MK | MAUNA KEA INTERNATIONAL</div>
          <div className="text-[12px] tracking-[3px] text-white/65 mt-1">EXECUTIVE SEARCH & ADVISORY</div>
        </div>
      </div>

      {/* Right Column (38%) */}
      <div className="w-[38%] h-full bg-white flex flex-col items-center justify-center overflow-y-auto">
        <div className="w-full max-w-[400px] flex flex-col">
          <div className="flex items-center gap-3 mb-1 justify-start ml-2">
            <span className="font-serif text-[33px] font-bold text-[#111]">MK</span>
            <span className="w-[1px] h-[36px] bg-[#ccc]"></span>
            <span className="flex flex-col">
              <span className="font-serif text-[19px] font-bold text-[#111]">MAUNA KEA</span>
              <span className="text-[13px] text-[#6b7a99] tracking-[1px] -mt-1 uppercase">International</span>
            </span>
          </div>
          <div className="text-[12px] uppercase tracking-[2px] text-[#6b7a99] text-left mb-8 ml-2">Executive Search & Advisory</div>
          
          <div className="flex gap-4 mb-6 border-b border-[#D4E0F0]">
            <button
              onClick={() => setTab("team")}
              className={`pb-2 text-[15px] font-bold transition-colors ${tab === "team" ? "border-b-2 border-[#133255] text-[#133255]" : "border-transparent text-[#6b7a99] hover:text-[#111]"}`}
            >
              Team Login
            </button>
            <button
              onClick={() => setTab("candidate")}
              className={`pb-2 text-[15px] font-bold transition-colors ${tab === "candidate" ? "border-b-2 border-[#133255] text-[#133255]" : "border-transparent text-[#6b7a99] hover:text-[#111]"}`}
            >
              Candidate Login
            </button>
          </div>
          
          {tab === "candidate" && (
            <p className="text-[14px] text-[#6b7a99] mb-4">Sign in with your personal email to access your candidate profile.</p>
          )}

          <SignIn 
            path="/sign-in" 
            routing="path" 
            signUpUrl="/sign-up" 
            forceRedirectUrl={tab === "team" ? "/dashboard/mandates" : "/dashboard/candidates"} 
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-none w-full bg-transparent p-0",
                headerTitle: "font-serif text-[21px] font-bold text-[#111] text-left ml-2",
                headerSubtitle: tab === "candidate" ? "hidden" : "text-[#6b7a99] text-[15px] ml-2",
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
