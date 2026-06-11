import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="min-h-screen bg-[#f4f7fd] flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-serif font-bold text-[#111] mb-2">Mauna Kea OS</h1>
        <p className="text-[14px] text-[#6b7a99]">Sign in with your @maunakea.co.in account to continue.</p>
      </div>
      <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" forceRedirectUrl="/dashboard/mandates" />
    </div>
  );
}
