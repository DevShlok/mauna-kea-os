import type { Metadata } from 'next';
import Link from 'next/link';
import { Scale, FileText, CheckCircle2, ShieldCheck, Mail, ArrowLeft, Building2, UserCheck, AlertCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service | Mauna Kea Executive Search OS',
  description: 'Terms of Service and Conditions of Use for Mauna Kea Executive Search OS (maunakea.co.in). Governance rules for candidates, clients, and platform users.',
};

export default function TermsOfServicePage() {
  const lastUpdated = "August 16, 2026";

  return (
    <div className="min-h-screen bg-[#071428] text-slate-100 font-sans selection:bg-[#D8B15B]/30 selection:text-[#D8B15B]">
      {/* ── Background Glow ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-b from-[#133255]/40 via-[#1d4d82]/10 to-transparent blur-[120px] rounded-full" />
        <div className="absolute top-[600px] -right-40 w-[600px] h-[600px] bg-[#D8B15B]/5 blur-[140px] rounded-full" />
      </div>

      {/* ── Top Navigation Bar ── */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#071428]/80 border-b border-white/[0.08]">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-serif text-lg font-bold text-[#133255] shadow-lg shadow-[#D8B15B]/20 transition-transform duration-200 group-hover:scale-105"
              style={{ background: "linear-gradient(135deg, #D8B15B, #f0c96a)" }}
            >
              MK
            </div>
            <div>
              <span className="font-serif text-[17px] font-bold block text-white tracking-tight leading-none">
                Mauna Kea
              </span>
              <span className="text-[10px] text-[#D8B15B] font-bold tracking-widest uppercase block mt-1">
                Executive Search OS
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-6 text-sm">
            <Link
              href="/privacy-policy"
              className="text-white/70 hover:text-white transition-colors text-[13px] font-medium hidden sm:inline-block"
            >
              Privacy Policy
            </Link>
            <Link
              href="/sign-in"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/15 transition-all duration-200 shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero Banner ── */}
      <section className="relative z-10 border-b border-white/[0.08] py-16 px-6 bg-gradient-to-b from-white/[0.02] to-transparent">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#D8B15B]/10 border border-[#D8B15B]/25 text-[#D8B15B] text-xs font-bold uppercase tracking-wider">
            <Scale className="w-3.5 h-3.5" />
            Terms & Conditions of Service
          </div>
          <h1 className="text-3xl sm:text-5xl font-serif font-bold text-white tracking-tight leading-tight">
            Terms of Service
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Please read these terms and conditions carefully before accessing or using the Mauna Kea OS recruitment platform and candidate portal.
          </p>
          <div className="pt-2 text-xs text-slate-500">
            Effective & Last Updated: <span className="text-slate-300 font-semibold">{lastUpdated}</span> • Official Domain: <span className="text-[#D8B15B] font-semibold">https://maunakea.co.in</span>
          </div>
        </div>
      </section>

      {/* ── Main Content Container ── */}
      <main className="relative z-10 max-w-4xl mx-auto px-6 py-12 space-y-12 leading-relaxed text-slate-300">
        
        {/* Quick Highlights Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-[#D8B15B]" />
            Agreement Overview
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Binding legal agreement governing use of maunakea.co.in.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Protects confidential executive search pipelines and assessments.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Clear rules for Google OAuth login and account security.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Standard corporate governance and intellectual property protections.</span>
            </div>
          </div>
        </div>

        {/* 1. Acceptance of Terms */}
        <section className="space-y-4">
          <h2 className="text-2xl font-serif font-bold text-white flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-[#D8B15B] flex items-center justify-center text-sm font-sans font-bold">1</span>
            Acceptance of Terms & Eligibility
          </h2>
          <p>
            By accessing or using the website at <a href="https://maunakea.co.in" className="text-[#D8B15B] underline underline-offset-2">https://maunakea.co.in</a>, registering an account, or using any feature of <strong>Mauna Kea OS</strong> (&ldquo;<strong>Platform</strong>&rdquo;, &ldquo;<strong>we</strong>&rdquo;, &ldquo;<strong>us</strong>&rdquo;, or &ldquo;<strong>our</strong>&rdquo;), you (&ldquo;<strong>User</strong>&rdquo;, &ldquo;<strong>Candidate</strong>&rdquo;, or &ldquo;<strong>Client</strong>&rdquo;) agree to be legally bound by these Terms of Service.
          </p>
          <p>
            If you are accessing the Platform on behalf of a company, organization, or corporate entity, you represent and warrant that you possess the full legal authority to bind that entity to these Terms.
          </p>
        </section>

        {/* 2. Platform Description */}
        <section className="space-y-4">
          <h2 className="text-2xl font-serif font-bold text-white flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-[#D8B15B] flex items-center justify-center text-sm font-sans font-bold">2</span>
            Platform Scope & Services
          </h2>
          <p>
            Mauna Kea OS is a proprietary executive search management operating system designed for:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs sm:text-sm">
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
              <div className="font-bold text-white mb-1 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#D8B15B]" />
                Candidate Portal
              </div>
              <p className="text-slate-400">Enabling senior leaders to maintain verified executive profiles, upload resumes, review interview stages, and track placement opportunities.</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
              <div className="font-bold text-white mb-1 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-sky-400" />
                Client Command Centre
              </div>
              <p className="text-slate-400">Enabling hiring organizations to track executive search funnels, review candidate competency matrices, schedule interviews, and manage agreements.</p>
            </div>
          </div>
        </section>

        {/* 3. Account Registration & Authentication */}
        <section className="space-y-4">
          <h2 className="text-2xl font-serif font-bold text-white flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-[#D8B15B] flex items-center justify-center text-sm font-sans font-bold">3</span>
            Account Security & Third-Party Sign-In (Google OAuth)
          </h2>
          <p>
            To access certain features of the Platform, you may register using direct email credentials or through verified third-party Single Sign-On providers such as <strong>Google OAuth</strong>.
          </p>
          <ul className="list-disc pl-6 space-y-2 text-sm sm:text-base">
            <li>You agree to provide accurate, current, and complete information during registration.</li>
            <li>You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account.</li>
            <li>You must notify us immediately at <a href="mailto:support@maunakea.co.in" className="text-[#D8B15B] underline">support@maunakea.co.in</a> if you suspect any unauthorized access or breach of security.</li>
            <li>Use of Google OAuth is governed by the respective Google Terms of Service and Privacy Policies.</li>
          </ul>
        </section>

        {/* 4. Confidentiality & Non-Disclosure */}
        <section className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#133255]/40 via-[#0a1f3d]/60 to-[#071428] border border-white/10 space-y-4">
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#D8B15B]" />
            Strict Confidentiality & Executive Data Protection
          </h2>
          <p className="text-sm text-slate-300">
            Due to the sensitive nature of executive recruitment and board-level search mandates:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-slate-300">
            <li>All candidate profiles, market mapping analytics, competency assessments, compensation details, and hiring mandate data shared on Mauna Kea OS are strictly confidential.</li>
            <li>Clients agree not to disclose, distribute, or circulate candidate dossiers or personal details outside of their authorized hiring decision committees.</li>
            <li>Candidates agree to treat confidential role briefs, strategic corporate plans, and client organization details as non-public corporate secrets.</li>
          </ul>
        </section>

        {/* 5. User Conduct & Prohibited Uses */}
        <section className="space-y-4">
          <h2 className="text-2xl font-serif font-bold text-white flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-[#D8B15B] flex items-center justify-center text-sm font-sans font-bold">4</span>
            Prohibited Activities
          </h2>
          <p>When using the Platform, you agree <strong>NOT</strong> to:</p>
          <ul className="list-disc pl-6 space-y-2 text-sm sm:text-base">
            <li>Use automated scripts, bots, spiders, or scrapers to extract data, profiles, or market intelligence from the Platform.</li>
            <li>Attempt to reverse-engineer, decompile, or compromise the security of any source code or underlying architecture.</li>
            <li>Submit false, fraudulent, defamatory, or misleading candidate credentials, resumes, or company information.</li>
            <li>Bypass or circumvent authentication layers, role-based access control (RBAC), or row-level security (RLS) policies.</li>
            <li>Transmit malware, viruses, or malicious code designed to disrupt platform operations.</li>
          </ul>
        </section>

        {/* 6. Intellectual Property */}
        <section className="space-y-4">
          <h2 className="text-2xl font-serif font-bold text-white flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-[#D8B15B] flex items-center justify-center text-sm font-sans font-bold">5</span>
            Intellectual Property Rights
          </h2>
          <p>
            The Platform, including but not limited to all software, algorithms, UI designs, graphics, branding, trademarks, logos, and competency assessment methodologies, is the exclusive intellectual property of Mauna Kea Executive Search and its licensors.
          </p>
          <p>
            No right, title, or interest in any part of the Platform is transferred to you except for the limited, non-exclusive, non-transferable license to use the service for its intended executive search purposes.
          </p>
        </section>

        {/* 7. Disclaimer of Warranties & Limitation of Liability */}
        <section className="space-y-4">
          <h2 className="text-2xl font-serif font-bold text-white flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-[#D8B15B] flex items-center justify-center text-sm font-sans font-bold">6</span>
            Disclaimer of Warranties & Limitation of Liability
          </h2>
          <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-xs sm:text-sm text-slate-300 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <AlertCircle className="w-4 h-4" />
              Standard Warranty Disclaimer
            </div>
            <p>
              The Platform is provided on an &ldquo;AS IS&rdquo; and &ldquo;AS AVAILABLE&rdquo; basis. While Mauna Kea exercises professional executive diligence, we do not guarantee that recruitment placements will result in guaranteed business outcomes or that the platform will operate completely error-free or uninterrupted.
            </p>
            <p>
              To the maximum extent permitted by applicable law, Mauna Kea shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from the use or inability to use the Platform.
            </p>
          </div>
        </section>

        {/* 8. Governing Law & Dispute Resolution */}
        <section className="space-y-4">
          <h2 className="text-2xl font-serif font-bold text-white flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-[#D8B15B] flex items-center justify-center text-sm font-sans font-bold">7</span>
            Governing Law & Jurisdiction
          </h2>
          <p>
            These Terms of Service shall be governed by and construed in accordance with the laws of the Republic of India. Any legal action, dispute, or proceeding arising out of or related to these Terms shall be subject to the exclusive jurisdiction of the competent courts situated in New Delhi, India.
          </p>
        </section>

        {/* 9. Contact Us */}
        <section className="p-6 sm:p-8 rounded-3xl bg-white/[0.02] border border-white/[0.08] space-y-4">
          <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2">
            <Mail className="w-5 h-5 text-[#D8B15B]" />
            Contact & Legal Inquiries
          </h2>
          <p className="text-sm text-slate-400">
            For questions or notices concerning these Terms of Service, please reach out to our legal department:
          </p>
          <div className="text-sm space-y-1 text-slate-300">
            <p><strong className="text-white">Organization:</strong> Mauna Kea Executive Search</p>
            <p><strong className="text-white">Website:</strong> <a href="https://maunakea.co.in" className="text-[#D8B15B]">https://maunakea.co.in</a></p>
            <p><strong className="text-white">Legal Inquiries:</strong> <a href="mailto:legal@maunakea.co.in" className="text-[#D8B15B]">legal@maunakea.co.in</a></p>
            <p><strong className="text-white">General Support:</strong> <a href="mailto:support@maunakea.co.in" className="text-[#D8B15B]">support@maunakea.co.in</a></p>
          </div>
        </section>

      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.08] bg-[#040d1a] py-12 px-6 mt-16 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            © {new Date().getFullYear()} Mauna Kea Executive Search. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <Link href="/privacy-policy" className="text-slate-400 hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms-of-service" className="text-slate-400 hover:text-white transition-colors">
              Terms of Service
            </Link>
            <Link href="/sign-in" className="text-slate-400 hover:text-white transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
