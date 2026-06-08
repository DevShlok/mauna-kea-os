import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex w-screen h-screen items-center justify-center bg-[#0a1628]">
      <SignIn />
    </div>
  );
}
