"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function FrameworksClient({ initialFrameworks }: { initialFrameworks: any[] }) {
  const router = useRouter();
  const frameworks = initialFrameworks;

  return (
    <div className="max-w-screen-xl mx-auto pb-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Framework Templates</h1>
        <Link href="/dashboard/frameworks/new" className="px-4 py-2 bg-yellow-500 text-blue-900 rounded text-xs font-bold hover:bg-yellow-400">+ New Framework</Link>
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
                  <td className="px-4 py-3 font-semibold text-blue-900">{fw.name}</td>
                  <td className="px-4 py-3 text-gray-600">{fw.industry}</td>
                  <td className="px-4 py-3 text-gray-500">{totalCriteria}</td>
                  <td className="px-4 py-3 text-gray-500">{fw.usedIn} mandates</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{fw.lastModified}</td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-2">
                      <button className="px-3 py-1 bg-blue-900 text-white rounded text-xs font-bold hover:bg-blue-800" onClick={() => router.push("/dashboard/frameworks/" + fw.id)}>Edit</button>
                      <button className="px-3 py-1 border border-gray-200 text-gray-500 rounded text-xs font-bold hover:bg-gray-50">Clone</button>
                      <button className="px-3 py-1 border border-red-200 text-red-500 rounded text-xs font-bold hover:bg-red-50">Delete</button>
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
