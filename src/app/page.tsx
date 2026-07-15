"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";

const FormRow = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <div className="group flex rounded-xl overflow-hidden border border-gray-200/80 bg-white/60 backdrop-blur-md shadow-sm hover:shadow-md hover:border-gray-300/80 transition-all duration-300">
    <div className="w-[140px] sm:w-[160px] flex-shrink-0 flex items-center px-4 py-3 bg-gray-50/80 border-r border-gray-200/60">
      <span className="text-[12px] sm:text-[13px] text-gray-700 font-semibold tracking-tight">{label}{required && <span className="text-red-400 ml-0.5">*</span>}</span>
    </div>
    <div className="flex-1 min-w-0">{children}</div>
  </div>
);

const inputCls = "w-full bg-transparent px-4 py-3 text-[13px] text-gray-800 outline-none placeholder:text-gray-400/70 placeholder:font-light";

export default function LandingPage() {
  const [showForm, setShowForm] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Form State
  const [supportType, setSupportType] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [description, setDescription] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (!phone.match(/^\d{10}$/)) {
      toast.error("Phone number must be exactly 10 digits.");
      return;
    }
    setIsSubmitting(true);
    await new Promise((res) => setTimeout(res, 1500));
    toast.success("Thank you for reaching out. Our specialists will connect with you shortly!");
    setIsSubmitting(false);
    setSupportType(""); setName(""); setCompany(""); setPosition("");
    setEmail(""); setPhone(""); setDescription(""); setAttachment(null);
    setShowForm(false);
  };

  return (
    <div className="min-h-screen flex font-sans overflow-hidden bg-white">
      {/* ── Left Panel: Mountain Image ── */}
      <div
        className={`hidden lg:block lg:w-1/2 relative h-screen transition-all duration-1000 ease-out ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}
      >
        <img
          src="/login-image.png"
          alt="Mauna Kea Mountain"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white/80 to-transparent" />
      </div>

      {/* ── Right Panel ── */}
      <div
        className={`w-full lg:w-1/2 relative h-screen transition-all duration-1000 ease-out delay-200 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}
      >
        {/* Blurred logo background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "url('/login-bg-removebg.png')",
            backgroundSize: '55%', backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
            filter: "blur(80px)", opacity: 0.06
          }}
        />

        {/* Scrollable content */}
        <div className="relative z-10 w-full h-full overflow-y-auto">
          <div
            className="w-full min-h-full flex flex-col items-center px-6 sm:px-12 transition-[padding] duration-700 ease-in-out"
            style={{ paddingTop: showForm ? '32px' : '28vh' }}
          >

            {/* ─── HEADER (always mounted, slides via parent padding) ─── */}
            <div className="w-full max-w-[540px] flex flex-col items-center flex-shrink-0">
              <img
                src="/Mauna Kea Header.jpeg"
                alt="Mauna Kea"
                className={`object-contain transition-all duration-700 ease-in-out ${showForm ? 'h-10 sm:h-12' : 'h-12 sm:h-16'}`}
                style={{ mixBlendMode: 'multiply' }}
              />
            </div>

            {/* ─── LANDING CONTENT (collapses when form shows) ─── */}
            <div
              className="w-full max-w-[540px] flex flex-col items-center text-center overflow-hidden transition-all duration-700 ease-in-out"
              style={{
                maxHeight: showForm ? '0px' : '600px',
                opacity: showForm ? 0 : 1,
                marginTop: showForm ? '0px' : '4px',
              }}
            >
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-[0.15em] mb-12 uppercase mt-2">
                Executive Search &amp; Advisory
              </h2>
              <div className="w-12 h-px bg-gray-300 mb-10" />
              <p className="text-2xl sm:text-[28px] font-serif italic text-gray-800 font-light mb-10 leading-relaxed">
                &ldquo;Depth defines legacy.&rdquo;
              </p>
              <div className="space-y-1.5 text-[13px] text-gray-500 font-normal mb-12 leading-relaxed">
                <p>Our platform is evolving, but our search mandates never stop.</p>
                <p>Let us know how we can support your executive leadership goals today.</p>
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="group relative bg-gray-900 hover:bg-black text-white px-10 py-3 rounded-lg text-sm font-semibold tracking-wide shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 overflow-hidden cursor-pointer mb-4"
              >
                <span className="relative z-10">Contact Us</span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
              </button>
            </div>

            {/* ─── FORM CONTENT (expands when form shows) ─── */}
            <div
              className="w-full max-w-[540px] overflow-hidden transition-all duration-700 ease-in-out"
              style={{
                maxHeight: showForm ? '2000px' : '0px',
                opacity: showForm ? 1 : 0,
                marginTop: showForm ? '8px' : '0px',
              }}
            >
              <div className="text-center mb-6">
                <p className="font-bold text-gray-900 text-sm mb-2.5 leading-snug">
                  Connecting exceptional talent with leadership opportunities.
                </p>
                <p className="text-[11px] sm:text-xs text-gray-500 leading-relaxed max-w-[420px] mx-auto">
                  Whether you are an organization looking to secure top-tier executive talent or
                  a professional ready for your next strategic career move, we are here to support your growth.
                  Share your brief details below, and our specialists will connect with you.
                </p>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-3">
                <FormRow label="How can we support you?" required>
                  <select
                    required value={supportType} onChange={e => setSupportType(e.target.value)}
                    className={`${inputCls} appearance-none cursor-pointer`}
                    style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")", backgroundPosition: 'right 12px center', backgroundRepeat: 'no-repeat', backgroundSize: '16px' }}
                  >
                    <option value="" disabled>Select an option</option>
                    <option value="I want to expand my team/ I need advisory services">I want to expand my team / I need advisory services</option>
                    <option value="I am looking for a career change">I am looking for a career change</option>
                  </select>
                </FormRow>

                <FormRow label="Name" required>
                  <input required type="text" placeholder="Enter your name" value={name} onChange={e => setName(e.target.value)} className={inputCls} />
                </FormRow>

                <FormRow label="Company name" required>
                  <input required type="text" placeholder="Enter your organisation's name" value={company} onChange={e => setCompany(e.target.value)} className={inputCls} />
                </FormRow>

                <FormRow label="Position" required>
                  <input required type="text" placeholder="Enter your Position" value={position} onChange={e => setPosition(e.target.value)} className={inputCls} />
                </FormRow>

                <FormRow label="Email" required>
                  <input required type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} />
                </FormRow>

                <FormRow label="Phone no." required>
                  <div className="flex items-center">
                    <select
                      value={countryCode} onChange={e => setCountryCode(e.target.value)}
                      className="bg-transparent pl-4 pr-1 py-3 text-[13px] text-gray-600 border-r border-gray-200/60 outline-none cursor-pointer font-medium"
                    >
                      <option value="+91">+91</option>
                      <option value="+1">+1</option>
                      <option value="+44">+44</option>
                      <option value="+61">+61</option>
                      <option value="+65">+65</option>
                      <option value="+971">+971</option>
                    </select>
                    <input
                      required type="tel" placeholder="Enter 10-digit number" value={phone}
                      onChange={e => { const val = e.target.value.replace(/\D/g, '').substring(0, 10); setPhone(val); }}
                      className={inputCls}
                    />
                  </div>
                </FormRow>

                <FormRow label="Upload attachment">
                  <div className="px-4 py-3 flex items-center">
                    <input
                      type="file" accept=".pdf,.doc,.docx,image/*"
                      onChange={e => setAttachment(e.target.files ? e.target.files[0] : null)}
                      className="w-full text-[12px] text-gray-600 file:mr-3 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-[11px] file:font-semibold file:bg-gray-900/10 file:text-gray-700 hover:file:bg-gray-900/20 file:transition-colors file:cursor-pointer"
                    />
                  </div>
                </FormRow>

                <FormRow label="Description">
                  <textarea
                    rows={4}
                    placeholder="Provide a summary of your organisation objectives or career aspirations — how we can support you"
                    value={description} onChange={e => setDescription(e.target.value)}
                    className={`${inputCls} resize-none`}
                  />
                </FormRow>

                <div className="pt-5 pb-4 flex items-center justify-center gap-6">
                  <button
                    type="button" onClick={() => setShowForm(false)}
                    className="text-xs text-gray-400 hover:text-gray-700 transition-colors font-medium cursor-pointer"
                  >
                    ← Back
                  </button>
                  <button
                    type="submit" disabled={isSubmitting}
                    className="group relative bg-gray-900 hover:bg-black text-white px-12 py-3 rounded-lg text-sm font-semibold tracking-wide shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 overflow-hidden cursor-pointer"
                  >
                    <span className="relative z-10">{isSubmitting ? "Submitting..." : "Submit"}</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                  </button>
                </div>
              </form>
            </div>



            <p className="py-4 text-[10px] text-gray-300 tracking-wider uppercase flex-shrink-0">
              © {new Date().getFullYear()} Mauna Kea · All rights reserved
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
