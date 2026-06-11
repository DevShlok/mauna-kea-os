import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col items-center justify-center w-full h-[80vh] animate-in fade-in duration-500">
      <Loader2 className="w-10 h-10 text-blue-900 animate-spin mb-4" />
      <h2 className="text-lg font-semibold text-gray-800 font-serif mb-1">Loading Workspace...</h2>
      <p className="text-sm text-gray-500">Fetching the latest data securely from the cloud</p>
    </div>
  );
}
