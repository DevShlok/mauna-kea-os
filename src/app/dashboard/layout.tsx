import { Sidebar } from "@/components/shared/Sidebar";
import { Topbar } from "@/components/shared/Topbar";
import { currentUser } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";

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
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-[#D4E0F0] max-w-sm w-full">
          <div className="flex justify-center mb-6">
            <UserButton />
          </div>
          <h1 className="text-xl font-bold text-red-600 mb-2">Access Denied</h1>
          <p className="text-sm text-gray-600 mb-6">You must use an authorized <strong>@maunakea.co.in</strong> email address to access the Mauna Kea OS.</p>
          <p className="text-xs text-gray-400">Please use the icon above to sign out and switch accounts.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-row h-screen overflow-hidden bg-[#f0f4fb]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
