import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="min-h-screen bg-[#f4f7fd] flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-serif font-bold text-[#111] mb-2">Mauna Kea OS</h1>
        <p className="text-[16px] text-[#6b7a99]">Create your account to continue.</p>
      </div>
      <SignUp 
        path="/sign-up" 
        routing="path" 
        signInUrl="/sign-in" 
        forceRedirectUrl="/dashboard" 
        appearance={{
          elements: {
            headerTitle: "hidden",
            headerSubtitle: "hidden",
          }
        }}
      />
    </div>
  );
}
