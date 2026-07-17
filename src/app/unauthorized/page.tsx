import Link from "next/link";
import { Lock } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center space-y-6">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-2">
          <Lock className="w-8 h-8 text-red-400" />
        </div>
        
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Access Denied</h1>
        
        <p className="text-gray-500 text-[14px] leading-relaxed">
          Your email address is not registered as an authorized user on the Mauna Kea platform. 
          If you believe this is an error, please contact your administrator to whitelist your account.
        </p>
        
        <div className="pt-4">
          <Link href="/sign-in" className="inline-block px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-black transition-colors">
            Return to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
