"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createFrameworkAction } from "@/app/actions";

export default function CreateFrameworkPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !industry) return;
    
    // We'll create a basic framework with one default category
    const fw = {
      name,
      industry,
      categories: [
        {
          name: "Core Competencies",
          criteria: [
            { name: "Technical Skills", weight: 10 },
            { name: "Leadership", weight: 10 }
          ]
        }
      ]
    };
    
    const newId = await createFrameworkAction(fw);
    router.push("/dashboard/frameworks"); // Redirect back to list
  };

  const inp = "w-full px-3 py-2 border border-gray-200 rounded text-sm outline-none focus:border-blue-900";
  const section = "bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-6";
  const sectionHead = "bg-gray-50 border-b border-gray-200 px-5 py-3 font-bold text-xs uppercase tracking-wider text-blue-900";

  return (
    <div className="max-w-3xl mx-auto pb-10">
      <div className="flex items-center gap-2 text-sm text-gray-400 font-semibold mb-6">
        <Link href="/dashboard/frameworks" className="hover:text-blue-900">Frameworks</Link>
        <span>/</span>
        <span className="text-gray-800">Create New Framework</span>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Create New Framework</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className={section}>
          <div className={sectionHead}>1 - Framework Details</div>
          <div className="p-5 grid grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Framework Name <span className="text-red-500">*</span></label>
              <input required value={name} onChange={(e) => setName(e.target.value)} type="text" className={inp} placeholder="e.g. Executive Assessment Framework"/>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Industry <span className="text-red-500">*</span></label>
              <input required value={industry} onChange={(e) => setIndustry(e.target.value)} type="text" className={inp} placeholder="e.g. Tech, Finance, Generic"/>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.push("/dashboard/frameworks")} className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded text-sm font-bold hover:bg-gray-50">
            Cancel
          </button>
          <button type="submit" className="px-5 py-2.5 bg-yellow-500 text-blue-900 rounded text-sm font-bold hover:bg-yellow-400 shadow-sm">
            Create Framework
          </button>
        </div>
      </form>
    </div>
  );
}
