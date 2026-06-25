"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function FrameworksClient({ initialFrameworks }: { initialFrameworks: any[] }) {
  const router = useRouter();
  const frameworks = initialFrameworks;

  return (
    <div className="max-w-screen-xl mx-auto pb-10">
      <div className="flex justify-between items-end mb-8">
        <div>
          <div className="text-[12px] text-gray-500 mb-1">Home / Frameworks</div>
          <h1 className="text-3xl font-serif font-bold text-[#133255] tracking-tight">Framework Templates</h1>
        </div>
        <Link href="/dashboard/frameworks/new" className="px-5 py-2.5 bg-[#D8B15B] text-[#133255] rounded-lg text-sm font-bold shadow-sm hover:bg-[#e8c97a] transition-colors inline-block mb-1">
          + New Framework
        </Link>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b-2 border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Industry</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Criteria #</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Used In</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Last Modified</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {frameworks.map((fw: any) => {
              const totalCriteria = fw.categories.reduce((s: number, c: any) => s + c.criteria.length, 0);
              return (
                <tr key={fw.id} className="border-b border-gray-50 hover:bg-blue-50 cursor-pointer" onClick={() => router.push("/dashboard/frameworks/" + fw.id)}>
                  <td className="px-4 py-3 font-semibold text-[#133255]">{fw.name}</td>
                  <td className="px-4 py-3 text-gray-600">{fw.industry}</td>
                  <td className="px-4 py-3 text-gray-500">{totalCriteria}</td>
                  <td className="px-4 py-3 text-gray-500">{fw.usedIn} mandates</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{fw.lastModified}</td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-2">
                      <button className="px-3 py-1 bg-[#133255] text-white rounded text-xs font-bold hover:bg-[#133255]" onClick={() => router.push("/dashboard/frameworks/" + fw.id)}>Edit</button>
                      <button className="px-3 py-1 border border-gray-200 text-gray-500 rounded text-xs font-bold hover:bg-gray-50">Clone</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
