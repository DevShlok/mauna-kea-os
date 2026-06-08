"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createMandateAction } from "@/app/actions";

export default function CreateMandatePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    company: "",
    role: "",
    ctc: "",
    exp: "",
    workMode: "Hybrid",
    clientPOC: "",
    pocEmail: "",
    pocPhone: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company || !form.role) return;
    
    const insertId = await createMandateAction(form);
    router.push("/dashboard/mandates/" + insertId);
  };

  const inp = "w-full px-3 py-2 border border-gray-200 rounded text-sm outline-none focus:border-blue-900";
  const section = "bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden";
  const sectionHead = "bg-gray-50 border-b border-gray-200 px-5 py-3 font-bold text-xs uppercase tracking-wider text-blue-900";

  return (
    <div className="max-w-3xl mx-auto pb-10">
      <div className="flex items-center gap-2 text-sm text-gray-400 font-semibold mb-6">
        <Link href="/dashboard/mandates" className="hover:text-blue-900">Mandates</Link>
        <span>/</span>
        <span className="text-gray-800">Create New Mandate</span>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Create New Mandate</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className={section}>
          <div className={sectionHead}>1 - Search Details</div>
          <div className="p-5 grid grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Company <span className="text-red-500">*</span></label>
              <input required value={form.company} onChange={(e) => setForm({...form, company: e.target.value})} type="text" className={inp} placeholder="Client company name"/>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Role / Position <span className="text-red-500">*</span></label>
              <input required value={form.role} onChange={(e) => setForm({...form, role: e.target.value})} type="text" className={inp} placeholder="e.g. CFO, CHRO"/>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">CTC Range</label>
              <input value={form.ctc} onChange={(e) => setForm({...form, ctc: e.target.value})} type="text" className={inp} placeholder="e.g. 180-240L"/>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Experience</label>
              <input value={form.exp} onChange={(e) => setForm({...form, exp: e.target.value})} type="text" className={inp} placeholder="e.g. 15-20 yrs"/>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Work Mode</label>
              <div className="flex gap-6">
                {["On-site","Hybrid","Remote"].map((mode) => (
                  <label key={mode} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name="workMode" checked={form.workMode === mode} onChange={() => setForm({...form, workMode: mode})}/>
                    {mode}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className={section}>
          <div className={sectionHead}>2 - Client Contact</div>
          <div className="p-5 grid grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">POC Name</label>
              <input value={form.clientPOC} onChange={(e) => setForm({...form, clientPOC: e.target.value})} type="text" className={inp} placeholder="Client point of contact"/>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">POC Email</label>
              <input value={form.pocEmail} onChange={(e) => setForm({...form, pocEmail: e.target.value})} type="email" className={inp} placeholder="poc@company.com"/>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">POC Phone</label>
              <input value={form.pocPhone} onChange={(e) => setForm({...form, pocPhone: e.target.value})} type="text" className={inp} placeholder="+91 XXXXX XXXXX"/>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.push("/dashboard/mandates")} className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded text-sm font-bold hover:bg-gray-50">
            Cancel
          </button>
          <button type="submit" className="px-5 py-2.5 bg-yellow-500 text-blue-900 rounded text-sm font-bold hover:bg-yellow-400 shadow-sm">
            Create Mandate
          </button>
        </div>
      </form>
    </div>
  );
}