import type { Metadata } from 'next';
import Link from 'next/link';
import { Shield, Lock, Eye, FileText, CheckCircle2, Mail, ArrowLeft, Globe, Database, Scale } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy | Mauna Kea Executive Search OS',
  description: 'Privacy Policy and Data Protection Practices for Mauna Kea Executive Search OS (maunakea.co.in). Details on Google OAuth integration, data collection, and user rights.',
};

export default function PrivacyPolicyPage() {
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
              href="/terms-of-service"
              className="text-white/70 hover:text-white transition-colors text-[13px] font-medium hidden sm:inline-block"
            >
              Terms of Service
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
            <Shield className="w-3.5 h-3.5" />
            Official Legal Document
          </div>
          <h1 className="text-3xl sm:text-5xl font-serif font-bold text-white tracking-tight leading-tight">
            Privacy Policy
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            How Mauna Kea OS collects, manages, uses, and safeguards user and organizational data across our executive hiring command center and candidate portal.
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
            <Lock className="w-5 h-5 text-[#D8B15B]" />
            Privacy Summary & Core Commitments
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>We never sell or monetize user or candidate data to third parties.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Strict compliance with the Google API Services User Data Policy.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>All sensitive recruitment data is encrypted in transit and at rest.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Full control over your data with direct data deletion rights upon request.</span>
            </div>
          </div>
        </div>

        {/* 1. Introduction */}
        <section className="space-y-4">
          <h2 className="text-2xl font-serif font-bold text-white flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-[#D8B15B] flex items-center justify-center text-sm font-sans font-bold">1</span>
            Introduction & Scope
          </h2>
          <p>
            Mauna Kea Executive Search (&ldquo;<strong>Mauna Kea</strong>&rdquo;, &ldquo;<strong>we</strong>&rdquo;, &ldquo;<strong>us</strong>&rdquo;, or &ldquo;<strong>our</strong>&rdquo;), operating under the domain <a href="https://maunakea.co.in" className="text-[#D8B15B] underline underline-offset-2">https://maunakea.co.in</a>, provides an executive search recruitment command platform and candidate engagement portal (&ldquo;<strong>Mauna Kea OS</strong>&rdquo; or the &ldquo;<strong>Platform</strong>&rdquo;).
          </p>
          <p>
            This Privacy Policy describes our practices concerning the collection, storage, processing, transfer, and protection of personal and corporate information when you use our website, authenticated portals, and integrated recruitment services.
          </p>
        </section>

        {/* 2. Information We Collect */}
        <section className="space-y-4">
          <h2 className="text-2xl font-serif font-bold text-white flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-[#D8B15B] flex items-center justify-center text-sm font-sans font-bold">2</span>
            Information We Collect
          </h2>
          <p>We collect information in the following categories to provide and enhance our executive recruitment operations:</p>
          
          <div className="space-y-3 pl-2 sm:pl-4">
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
              <h3 className="font-bold text-white text-sm mb-1 flex items-center gap-2">
                <Globe className="w-4 h-4 text-sky-400" />
                A. Authentication & Account Information (Including Google OAuth)
              </h3>
              <p className="text-xs sm:text-sm text-slate-400">
                When you sign in using email/password or Google OAuth Single Sign-On (SSO), we collect your name, verified primary email address, profile photo URL, and Google Account ID for identity verification and secure session management.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
              <h3 className="font-bold text-white text-sm mb-1 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#D8B15B]" />
                B. Candidate Professional Profiles
              </h3>
              <p className="text-xs sm:text-sm text-slate-400">
                Resumes, curriculum vitae (CV), LinkedIn profile exports, employment history, leadership competencies, career timeline, compensation milestones, notice period, and structured conversational interview responses submitted during candidate onboarding.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
              <h3 className="font-bold text-white text-sm mb-1 flex items-center gap-2">
                <Scale className="w-4 h-4 text-purple-400" />
                C. Client & Mandate Data
              </h3>
              <p className="text-xs sm:text-sm text-slate-400">
                Client organizational details, corporate entity information, hiring mandates, interview evaluations, feedback logs, commercial contract parameters, GST/tax identifiers, and invoicing records.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
              <h3 className="font-bold text-white text-sm mb-1 flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                D. Technical & Log Data
              </h3>
              <p className="text-xs sm:text-sm text-slate-400">
                IP addresses, browser type, device characteristics, timestamps, access logs, and session cookies required for network security, rate limiting, and system auditability.
              </p>
            </div>
          </div>
        </section>

        {/* 3. Google API Limited Use Disclosure */}
        <section className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#133255]/40 via-[#0a1f3d]/60 to-[#071428] border-2 border-[#D8B15B]/30 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D8B15B]/15 text-[#D8B15B] text-xs font-bold uppercase tracking-wider">
            Google API Compliance
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-white">
            Google API Services User Data Policy & Limited Use Disclosure
          </h2>
          <p className="text-slate-200 text-sm sm:text-base">
            Mauna Kea OS integrates with Google OAuth to enable seamless single sign-on authentication for candidates, clients, and consultants.
          </p>
          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 text-xs sm:text-sm text-slate-300 space-y-2">
            <p className="font-medium text-white">
              Mauna Kea OS&apos;s use and transfer to any other app of information received from Google APIs will adhere to the{' '}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#D8B15B] underline hover:text-[#f0c96a]"
              >
                Google API Services User Data Policy
              </a>
              , including the Limited Use requirements.
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
              <li>We only request Google OAuth scopes strictly necessary for identity verification (<code className="text-[#D8B15B] bg-white/5 px-1 py-0.5 rounded">openid</code>, <code className="text-[#D8B15B] bg-white/5 px-1 py-0.5 rounded">email</code>, <code className="text-[#D8B15B] bg-white/5 px-1 py-0.5 rounded">profile</code>).</li>
              <li>We do <strong>NOT</strong> transfer or sell Google user data to third parties for advertising or commercial brokerage.</li>
              <li>We do <strong>NOT</strong> use Google user data to train generalized artificial intelligence (AI) or machine learning models without explicit consent.</li>
              <li>Human access to user data is strictly restricted to authorized platform administrators resolving specific technical or support inquiries.</li>
            </ul>
          </div>
        </section>

        {/* 4. How We Use Information */}
        <section className="space-y-4">
          <h2 className="text-2xl font-serif font-bold text-white flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-[#D8B15B] flex items-center justify-center text-sm font-sans font-bold">3</span>
            How We Use Your Information
          </h2>
          <ul className="list-disc pl-6 space-y-2 text-sm sm:text-base">
            <li><strong>Authentication & Security:</strong> Verifying credentials, managing access control, preventing fraudulent logins, and auditing platform security.</li>
            <li><strong>Executive Recruitment Facilitation:</strong> Matching senior leadership candidates with executive hiring mandates opened by client organizations.</li>
            <li><strong>Candidate & Client Dashboards:</strong> Providing structured profiles, interview schedules, competency comparison matrices, and pipeline analytics.</li>
            <li><strong>Communication:</strong> Transmitting interview notifications, mandate status updates, contract documents, and customer support communications.</li>
            <li><strong>Compliance & Governance:</strong> Maintaining legal audit logs, tax invoicing records (GST), and regulatory reporting.</li>
          </ul>
        </section>

        {/* 5. Data Storage, Security & Retention */}
        <section className="space-y-4">
          <h2 className="text-2xl font-serif font-bold text-white flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-[#D8B15B] flex items-center justify-center text-sm font-sans font-bold">4</span>
            Data Protection, Security & Retention
          </h2>
          <p>
            We implement enterprise-grade technical and organizational safeguards:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-sm sm:text-base">
            <li><strong>Encryption:</strong> All data in transit is protected using TLS 1.3 encryption; all database stores and documents are encrypted at rest with AES-256 standards.</li>
            <li><strong>Row-Level Security (RLS):</strong> Granular multi-tenant database policies isolate candidate profiles and client organizational data.</li>
            <li><strong>Retention Periods:</strong> Candidate and client data is retained as long as the account remains active or as required by statutory financial regulations (e.g. tax and contract invoice histories).</li>
          </ul>
        </section>

        {/* 6. User Data Rights & Deletion */}
        <section className="space-y-4">
          <h2 className="text-2xl font-serif font-bold text-white flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-[#D8B15B] flex items-center justify-center text-sm font-sans font-bold">5</span>
            Your Privacy Rights & Data Deletion Requests
          </h2>
          <p>
            Under applicable data protection laws, you possess the right to:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs sm:text-sm">
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
              <div className="font-bold text-white mb-1">Access & Portability</div>
              <p className="text-slate-400">Request a complete copy of the personal data held on your profile.</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
              <div className="font-bold text-white mb-1">Correction & Update</div>
              <p className="text-slate-400">Edit or update your contact details and resume at any time via your portal.</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
              <div className="font-bold text-white mb-1">Account & Data Deletion</div>
              <p className="text-slate-400">Request complete erasure of your candidate profile and account data.</p>
            </div>
          </div>
          <p className="pt-2 text-sm">
            To submit a data access or deletion request, please email our Data Protection team at{' '}
            <a href="mailto:privacy@maunakea.co.in" className="text-[#D8B15B] font-semibold underline">
              privacy@maunakea.co.in
            </a>
            . We process all verified requests within 30 days.
          </p>
        </section>

        {/* 7. Contact Us */}
        <section className="p-6 sm:p-8 rounded-3xl bg-white/[0.02] border border-white/[0.08] space-y-4">
          <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2">
            <Mail className="w-5 h-5 text-[#D8B15B]" />
            Contact & Legal Enquiries
          </h2>
          <p className="text-sm text-slate-400">
            If you have questions, concerns, or regulatory inquiries regarding this Privacy Policy or our data handling practices, please contact our legal and privacy team:
          </p>
          <div className="text-sm space-y-1 text-slate-300">
            <p><strong className="text-white">Organization:</strong> Mauna Kea Executive Search</p>
            <p><strong className="text-white">Website:</strong> <a href="https://maunakea.co.in" className="text-[#D8B15B]">https://maunakea.co.in</a></p>
            <p><strong className="text-white">Privacy Email:</strong> <a href="mailto:privacy@maunakea.co.in" className="text-[#D8B15B]">privacy@maunakea.co.in</a></p>
            <p><strong className="text-white">Support Email:</strong> <a href="mailto:support@maunakea.co.in" className="text-[#D8B15B]">support@maunakea.co.in</a></p>
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
