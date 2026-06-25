import { Sidebar } from "@/components/shared/Sidebar";
import { Topbar } from "@/components/shared/Topbar";
import { currentUser } from "@clerk/nextjs/server";
import { UserButton, SignOutButton } from "@clerk/nextjs";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress;

  if (email && !email.endsWith("@maunakea.co.in")) {
    return (
      <div className="min-h-screen bg-[#f4f7fd] flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-[#D4E0F0] max-w-md w-full">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-2xl font-bold">!</div>
          </div>
          <h1 className="text-xl font-bold text-red-600 mb-2">Access Denied</h1>
          <p className="text-sm text-gray-600 mb-6">You are logged in as <strong className="text-[#111]">{email}</strong>. You must use an authorized <strong>@maunakea.co.in</strong> email address to access the Mauna Kea OS.</p>
          
          <div className="flex flex-col gap-3">
            <SignOutButton signOutOptions={{ redirectUrl: '/sign-in' }}>
              <button className="w-full bg-[#133255] hover:bg-[#0e3178] text-white font-semibold py-2.5 rounded-md transition-colors text-sm">
                Sign out and use another account
              </button>
            </SignOutButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-row h-screen overflow-hidden bg-[#f0f4fb] print:h-auto print:overflow-visible print:bg-white">
      <div className="print:hidden">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden print:overflow-visible">
        <div className="print:hidden">
          <Topbar />
        </div>
        <main className="flex-1 overflow-y-auto p-6 print:p-0 print:overflow-visible">
          {children}
        </main>
      </div>
    </div>
  );
}
