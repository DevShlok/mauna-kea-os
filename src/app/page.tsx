"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";
import { 
  Shield, 
  Users, 
  Briefcase, 
  Lock, 
  CheckCircle2, 
  ArrowRight, 
  Building2, 
  UserCheck, 
  Scale, 
  Layers, 
  Mail, 
  Globe, 
  Sparkles,
  ChevronRight,
  ExternalLink
} from "lucide-react";
import { submitContactForm } from "@/actions/contact";
import { COUNTRY_CODES } from "@/lib/countries";

const FormRow = ({ label, required, zIndex, children }: { label: string; required?: boolean; zIndex?: number; children: React.ReactNode }) => (
  <div className="group flex rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-md shadow-sm hover:border-white/20 transition-all duration-300" style={{ zIndex, position: zIndex ? 'relative' : undefined }}>
    <div className="w-[140px] sm:w-[170px] flex-shrink-0 flex items-center px-4 py-3 bg-white/[0.02] border-r border-white/10 rounded-l-xl">
      <span className="text-[12px] sm:text-[13px] text-slate-300 font-semibold tracking-tight">{label}{required && <span className="text-[#D8B15B] ml-0.5">*</span>}</span>
    </div>
    <div className="flex-1 min-w-0">{children}</div>
  </div>
);

const inputCls = "w-full bg-transparent px-4 py-3 text-[13px] text-white outline-none placeholder:text-slate-500 font-normal";

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

  // Form State
  const [supportType, setSupportType] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [countryIso, setCountryIso] = useState("in");
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => { 
    setMounted(true); 
    
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCountryOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData();
    formData.append("supportType", supportType);
    formData.append("name", name);
    formData.append("company", company);
    formData.append("position", position);
    formData.append("email", email);
    formData.append("countryCode", countryCode);
    formData.append("phone", phone);
    formData.append("description", description);
    if (attachment) {
      formData.append("attachment", attachment);
    }
    
    const result = await submitContactForm(formData);
    
    if (result.success) {
      toast.success("Thank you for reaching out. Our executive search specialists will connect with you shortly!");
      setSupportType(""); setName(""); setCompany(""); setPosition("");
      setEmail(""); setPhone(""); setDescription(""); setAttachment(null);
      const fileInput = document.getElementById("file-upload") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
      setShowContactModal(false);
    } else {
      toast.error(result.error || "Something went wrong. Please try again.");
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#071428] text-slate-100 font-sans selection:bg-[#D8B15B]/30 selection:text-[#D8B15B] relative overflow-x-hidden">
      
      {/* ── Background Atmospheric Glows ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-b from-[#133255]/50 via-[#1d4d82]/15 to-transparent blur-[140px] rounded-full" />
        <div className="absolute top-[800px] -left-40 w-[600px] h-[600px] bg-[#D8B15B]/5 blur-[160px] rounded-full" />
        <div className="absolute top-[1600px] -right-40 w-[700px] h-[700px] bg-[#133255]/30 blur-[150px] rounded-full" />
      </div>

      {/* ── Top Navigation Bar ── */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#071428]/85 border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          
          {/* Logo & Exact App Name */}
          <Link href="/" className="flex items-center gap-3 group">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-serif text-lg font-bold text-[#133255] shadow-lg shadow-[#D8B15B]/20 transition-transform duration-200 group-hover:scale-105"
              style={{ background: "linear-gradient(135deg, #D8B15B, #f0c96a)" }}
            >
              MK
            </div>
            <div>
              <span className="font-serif text-[18px] font-bold block text-white tracking-tight leading-none">
                Mauna Kea
              </span>
              <span className="text-[10px] text-[#D8B15B] font-bold tracking-widest uppercase block mt-1">
                Executive Search Platform
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-[13px] font-medium text-slate-300">
            <a href="#about" className="hover:text-white transition-colors">About</a>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#purpose" className="hover:text-white transition-colors">Purpose</a>
            <a href="#security" className="hover:text-white transition-colors">Security &amp; Google SSO</a>
            <Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms-of-service" className="hover:text-white transition-colors">Terms of Service</Link>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowContactModal(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-semibold text-slate-200 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-200 cursor-pointer"
            >
              Contact Us
            </button>
            <Link
              href="/sign-in"
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-[13px] font-bold text-[#133255] shadow-md shadow-[#D8B15B]/20 hover:shadow-[#D8B15B]/30 hover:scale-[1.02] transition-all duration-200 cursor-pointer"
              style={{ background: "linear-gradient(135deg, #D8B15B, #f0c96a)" }}
            >
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── 1. Hero Section ── */}
      <section className="relative z-10 pt-16 pb-20 px-6 max-w-5xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#D8B15B]/10 border border-[#D8B15B]/30 text-[#D8B15B] text-xs font-bold uppercase tracking-widest animate-in fade-in duration-700">
          <Sparkles className="w-3.5 h-3.5" />
          Next-Generation Executive Search &amp; Hiring Platform
        </div>

        <h1 className="text-4xl sm:text-6xl font-serif font-bold text-white tracking-tight leading-[1.15]">
          Executive Hiring Built on <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D8B15B] via-[#f0c96a] to-[#D8B15B]">Depth &amp; Precision</span>
        </h1>

        <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed">
          <strong>Mauna Kea</strong> is a specialized executive search operating system designed to give organizations complete visibility, depth, and control over C-suite and senior leadership recruitment mandates.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/sign-in"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm text-[#133255] shadow-lg shadow-[#D8B15B]/25 hover:shadow-[#D8B15B]/40 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, #D8B15B, #f0c96a)" }}
          >
            <span>Access Platform (Sign In)</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          
          <button
            onClick={() => setShowContactModal(true)}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-semibold text-sm text-white bg-white/10 hover:bg-white/15 border border-white/15 hover:border-white/25 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Inquire About Search Mandates</span>
          </button>
        </div>

        {/* Trust Badges */}
        <div className="pt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto text-left text-xs">
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center gap-3">
            <Shield className="w-5 h-5 text-[#D8B15B] shrink-0" />
            <div>
              <div className="font-bold text-white">Google OAuth 2.0</div>
              <div className="text-slate-400">Secure One-Click SSO</div>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center gap-3">
            <Lock className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="font-bold text-white">AES-256 Encryption</div>
              <div className="text-slate-400">Encrypted at Rest &amp; Transit</div>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center gap-3">
            <Building2 className="w-5 h-5 text-sky-400 shrink-0" />
            <div>
              <div className="font-bold text-white">Client Command Centre</div>
              <div className="text-slate-400">Full Pipeline Visibility</div>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center gap-3">
            <UserCheck className="w-5 h-5 text-purple-400 shrink-0" />
            <div>
              <div className="font-bold text-white">Candidate Portal</div>
              <div className="text-slate-400">Verified Leadership Profiles</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. About & Purpose of Application Section ── */}
      <section id="about" className="relative z-10 py-16 px-6 border-t border-white/[0.08] bg-white/[0.01]">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-[#D8B15B] text-xs font-bold uppercase tracking-wider">Application Purpose &amp; Overview</span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white">What is Mauna Kea OS?</h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              <strong>Mauna Kea</strong> is an executive search decision platform designed to eliminate the opacity of traditional executive recruitment. It provides hiring committees and senior candidates with real-time access to the entire talent universe and structured hiring milestones.
            </p>
          </div>

          <div id="purpose" className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1 */}
            <div className="p-8 rounded-3xl bg-white/[0.03] border border-white/[0.08] hover:border-[#D8B15B]/40 transition-all duration-300 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#D8B15B]/10 border border-[#D8B15B]/20 text-[#D8B15B] flex items-center justify-center">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-serif font-bold text-white">For Organizations &amp; Clients</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Client organizations gain real-time visibility into market mapping, candidate shortlists, role-specific competency comparison matrices, interview schedules, and closed-loop search recalibration.
              </p>
              <ul className="space-y-2 text-xs text-slate-400 pt-2 border-t border-white/[0.05]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Interactive Competency Matrix benchmarking</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Department &amp; mandate access isolation</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>One-click multi-slot interview scheduling</span>
                </li>
              </ul>
            </div>

            {/* Card 2 */}
            <div className="p-8 rounded-3xl bg-white/[0.03] border border-white/[0.08] hover:border-[#D8B15B]/40 transition-all duration-300 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
                <UserCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-serif font-bold text-white">For Leadership Candidates</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Senior executives can build comprehensive career profiles, upload CVs or LinkedIn exports, track active search mandates, and manage upcoming interviews securely.
              </p>
              <ul className="space-y-2 text-xs text-slate-400 pt-2 border-t border-white/[0.05]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Step-by-step career profile builder</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Strict confidentiality and privacy controls</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Direct interview status &amp; feedback updates</span>
                </li>
              </ul>
            </div>

            {/* Card 3 */}
            <div className="p-8 rounded-3xl bg-white/[0.03] border border-white/[0.08] hover:border-[#D8B15B]/40 transition-all duration-300 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                <Scale className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-serif font-bold text-white">Legal, Contracts &amp; Governance</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Automated legal repository, commercial contract generation, retainer billing, milestone tracking, GST-compliant tax invoices, and immutable audit logging.
              </p>
              <ul className="space-y-2 text-xs text-slate-400 pt-2 border-t border-white/[0.05]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Dynamic contract templates &amp; renewals</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Automated tax invoice calculation &amp; ledger</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Immutable audit logging for complete compliance</span>
                </li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* ── 3. Google OAuth & Authentication Purpose Section ── */}
      <section id="security" className="relative z-10 py-16 px-6 border-t border-white/[0.08]">
        <div className="max-w-4xl mx-auto p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-[#133255]/50 via-[#0a1f3d]/60 to-[#071428] border-2 border-[#D8B15B]/30 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D8B15B]/15 text-[#D8B15B] text-xs font-bold uppercase tracking-wider">
            Google OAuth &amp; Security Integration
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white">
            How Mauna Kea Uses Google Authentication
          </h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            <strong>Mauna Kea</strong> uses Google OAuth Single Sign-On (SSO) exclusively to provide secure, verified, and friction-free user authentication for our candidates, client decision-makers, and recruitment consultants.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm pt-2">
            <div className="p-4 rounded-2xl bg-black/30 border border-white/10 space-y-1.5">
              <div className="font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Verified Identity
              </div>
              <p className="text-slate-400">Confirms official organizational and candidate email addresses to ensure only authorized personnel access confidential mandate files.</p>
            </div>
            <div className="p-4 rounded-2xl bg-black/30 border border-white/10 space-y-1.5">
              <div className="font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Limited Scope Request
              </div>
              <p className="text-slate-400">We only request basic profile permissions (<code className="text-[#D8B15B]">email</code>, <code className="text-[#D8B15B]">profile</code>, <code className="text-[#D8B15B]">openid</code>) required for secure session validation.</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-black/50 border border-white/10 text-xs text-slate-400 space-y-1">
            <p className="text-slate-300 font-semibold">Google API Services Limited Use Disclosure:</p>
            <p>
              Mauna Kea OS adheres strictly to the{' '}
              <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-[#D8B15B] underline">
                Google API Services User Data Policy
              </a>
              . Google user data is never sold, never transferred to data brokers, and never used for commercial advertising.
            </p>
          </div>
        </div>
      </section>

      {/* ── 4. Key Feature Workflow Showcase ── */}
      <section id="features" className="relative z-10 py-16 px-6 border-t border-white/[0.08] bg-white/[0.01]">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-[#D8B15B] text-xs font-bold uppercase tracking-wider">Product Features</span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white">Comprehensive Executive Architecture</h2>
            <p className="text-slate-300 text-sm sm:text-base">
              A unified platform connecting every phase of executive talent search, evaluation, and organizational governance.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-white/5 text-[#D8B15B] flex items-center justify-center font-bold">01</div>
              <h4 className="font-bold text-white text-base">Market Mapping</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Exhaustive mapping of the leadership talent landscape categorized across Tier-1 competitor organizations.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-white/5 text-[#D8B15B] flex items-center justify-center font-bold">02</div>
              <h4 className="font-bold text-white text-base">Competency Matrix</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Objective scoring across role-specific competencies, leadership maturity, and cultural alignment.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-white/5 text-[#D8B15B] flex items-center justify-center font-bold">03</div>
              <h4 className="font-bold text-white text-base">Decision Scheduling</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Multi-slot interview coordination, calendar integration, and immediate decision capture loops.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-white/5 text-[#D8B15B] flex items-center justify-center font-bold">04</div>
              <h4 className="font-bold text-white text-base">Next Steps Action Feed</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Structured feedback, search scope recalibration, compensation alignment, and automated workflow triggers.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ── 5. Contact & Advisory Modal / Section ── */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-[#0a1f3d] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl relative my-8">
            
            <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
              <div>
                <h3 className="text-xl font-serif font-bold text-white">Contact Mauna Kea</h3>
                <p className="text-xs text-slate-400">Share your mandate details or career aspirations</p>
              </div>
              <button 
                onClick={() => setShowContactModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-3">
              <FormRow label="How can we help?" required>
                <select
                  required value={supportType} onChange={e => setSupportType(e.target.value)}
                  className={`${inputCls} appearance-none cursor-pointer bg-[#0a1f3d]`}
                >
                  <option value="" disabled className="bg-[#0a1f3d]">Select an option</option>
                  <option value="I want to expand my executive team" className="bg-[#0a1f3d]">I want to expand my executive team</option>
                  <option value="I am looking for an executive leadership role" className="bg-[#0a1f3d]">I am looking for an executive leadership role</option>
                  <option value="General platform inquiry" className="bg-[#0a1f3d]">General platform inquiry</option>
                </select>
              </FormRow>

              <FormRow label="Your Name" required>
                <input required type="text" placeholder="Full name" value={name} onChange={e => setName(e.target.value)} className={inputCls} />
              </FormRow>

              <FormRow label="Organization" required>
                <input required type="text" placeholder="Company or organization" value={company} onChange={e => setCompany(e.target.value)} className={inputCls} />
              </FormRow>

              <FormRow label="Position / Role" required>
                <input required type="text" placeholder="Current role or title" value={position} onChange={e => setPosition(e.target.value)} className={inputCls} />
              </FormRow>

              <FormRow label="Email" required>
                <input required type="email" placeholder="Official email address" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} />
              </FormRow>

              <FormRow label="Phone Number" required zIndex={50}>
                <div className="relative flex items-center w-full" ref={dropdownRef}>
                  <button 
                    type="button" 
                    onClick={() => setIsCountryOpen(!isCountryOpen)} 
                    className="flex items-center justify-center bg-transparent px-2 py-3 text-[13px] text-slate-300 border-r border-white/10 outline-none cursor-pointer font-medium w-[85px]"
                  >
                    <div className="flex items-center space-x-1.5">
                      <img src={`https://flagcdn.com/w20/${countryIso}.png`} className="w-[16px] h-[12px] object-cover rounded-xs" alt="" />
                      <span>{countryCode}</span>
                    </div>
                  </button>
                  
                  {isCountryOpen && (
                    <div className="absolute bottom-[calc(100%+4px)] left-0 w-[260px] max-h-[220px] overflow-y-auto bg-[#071428] border border-white/20 shadow-2xl rounded-xl z-50 p-1.5">
                      {COUNTRY_CODES.map((country) => (
                        <button 
                          key={country.name}
                          type="button"
                          onClick={() => { setCountryCode(country.code); setCountryIso(country.iso); setIsCountryOpen(false); }}
                          className="w-full flex items-center px-3 py-1.5 text-[12px] text-slate-200 hover:bg-white/10 rounded-lg transition-colors text-left"
                        >
                          <img src={`https://flagcdn.com/w20/${country.iso}.png`} className="w-[16px] h-[12px] object-cover rounded-xs mr-2 shrink-0" alt="" />
                          <span className="flex-1 truncate mr-2">{country.name}</span>
                          <span className="text-slate-400 font-semibold shrink-0">{country.code}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <input
                    required 
                    type="tel" 
                    placeholder="10-digit number" 
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, '').substring(0, 10))}
                    className={inputCls}
                  />
                </div>
              </FormRow>

              <FormRow label="Brief Summary">
                <textarea
                  rows={3}
                  placeholder="Tell us how we can support your executive search goals..."
                  value={description} onChange={e => setDescription(e.target.value)}
                  className={`${inputCls} resize-none`}
                />
              </FormRow>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button" onClick={() => setShowContactModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-[#133255] shadow-lg shadow-[#D8B15B]/20 hover:shadow-[#D8B15B]/30 disabled:opacity-50 transition-all cursor-pointer"
                  style={{ background: "linear-gradient(135deg, #D8B15B, #f0c96a)" }}
                >
                  {isSubmitting ? "Submitting..." : "Send Message"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.08] bg-[#040d1a] py-16 px-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            
            {/* Column 1: Identity */}
            <div className="space-y-4 md:col-span-2">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center font-serif text-base font-bold text-[#133255]"
                  style={{ background: "linear-gradient(135deg, #D8B15B, #f0c96a)" }}
                >
                  MK
                </div>
                <div>
                  <span className="font-serif text-[17px] font-bold block text-white leading-none">
                    Mauna Kea
                  </span>
                  <span className="text-[9px] text-[#D8B15B] font-bold tracking-widest uppercase block mt-1">
                    Executive Search &amp; Advisory
                  </span>
                </div>
              </div>
              <p className="text-slate-400 text-xs max-w-md leading-relaxed">
                Mauna Kea is an executive search decision platform designed to provide organizations and leadership candidates with transparency, depth, and structured recruitment governance.
              </p>
              <div className="text-[11px] text-slate-500">
                Official Domain: <span className="text-slate-300 font-semibold">https://maunakea.co.in</span>
              </div>
            </div>

            {/* Column 2: Legal & Verification Links */}
            <div className="space-y-3">
              <h5 className="text-white font-bold text-xs uppercase tracking-wider">Legal &amp; Compliance</h5>
              <ul className="space-y-2 text-slate-400 text-xs">
                <li>
                  <Link href="/privacy-policy" className="hover:text-[#D8B15B] transition-colors flex items-center gap-1.5">
                    <ChevronRight className="w-3 h-3 text-[#D8B15B]" />
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms-of-service" className="hover:text-[#D8B15B] transition-colors flex items-center gap-1.5">
                    <ChevronRight className="w-3 h-3 text-[#D8B15B]" />
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="hover:text-[#D8B15B] transition-colors flex items-center gap-1.5">
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                    Google API User Data Policy
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3: Contact & Support */}
            <div className="space-y-3">
              <h5 className="text-white font-bold text-xs uppercase tracking-wider">Contact Channels</h5>
              <ul className="space-y-2 text-slate-400 text-xs">
                <li className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-[#D8B15B]" />
                  <a href="mailto:support@maunakea.co.in" className="hover:text-white transition-colors">support@maunakea.co.in</a>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-[#D8B15B]" />
                  <a href="mailto:privacy@maunakea.co.in" className="hover:text-white transition-colors">privacy@maunakea.co.in</a>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-[#D8B15B]" />
                  <a href="mailto:legal@maunakea.co.in" className="hover:text-white transition-colors">legal@maunakea.co.in</a>
                </li>
              </ul>
            </div>

          </div>

          <div className="pt-8 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <div>
              © {new Date().getFullYear()} Mauna Kea Executive Search. All rights reserved.
            </div>
            <div className="flex items-center gap-6">
              <Link href="/sign-in" className="hover:text-white transition-colors">
                Platform Sign In
              </Link>
              <Link href="/privacy-policy" className="hover:text-white transition-colors">
                Privacy
              </Link>
              <Link href="/terms-of-service" className="hover:text-white transition-colors">
                Terms
              </Link>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
