"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { createMandateAction } from "@/app/actions";

export default function CreateMandateClient({ frameworks }: { frameworks: any[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCompany = searchParams.get("company") || "";

  const [form, setForm] = useState({
    company: initialCompany,
    role: "",
    ctc: "",
    exp: "",
    workMode: "Hybrid",
    diversity: "",
    clientPOC: "",
    pocEmail: "",
    pocPhone: "",
    frameworkId: "",
    jdText: "",
    interviewNotesText: "",
    additionalDocsText: "",
    consultantNotes: "",
    openQuestions: "",
  });

  const [sectors, setSectors] = useState<string[]>([]);
  const [targetCompanies, setTargetCompanies] = useState<string[]>([]);
  const [geography, setGeography] = useState<string[]>([]);
  const [pocCc, setPocCc] = useState<string[]>([]);

  const [isExtracting, setIsExtracting] = useState<Record<string, boolean>>({});
  const [extractedStatus, setExtractedStatus] = useState<Record<string, boolean>>({});

  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const val = e.currentTarget.value.trim();
      if (val) {
        setter(prev => [...prev, val]);
        e.currentTarget.value = "";
      }
    }
  };

  const removeTag = (index: number, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter(prev => prev.filter((_, i) => i !== index));
  };

  const simulateOCR = (type: string) => {
    setIsExtracting(prev => ({ ...prev, [type]: true }));
    setTimeout(() => {
      setIsExtracting(prev => ({ ...prev, [type]: false }));
      setExtractedStatus(prev => ({ ...prev, [type]: true }));
      
      const summaries: any = {
        jd: "• Extracted JD: Candidate must have strong P&L experience.\\n• Minimum 15 years in BFSI.",
        notes: "• Extracted Notes: Client needs a strategic board partner.",
        docs: "• Extracted Docs: Retainer fee agreed, 90 day timeline."
      };

      if (type === 'jd') setForm(prev => ({...prev, jdText: summaries.jd}));
      if (type === 'notes') setForm(prev => ({...prev, interviewNotesText: summaries.notes}));
      if (type === 'docs') setForm(prev => ({...prev, additionalDocsText: summaries.docs}));

    }, 1500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company || !form.role) return;
    
    // We pass all the extended fields here. Note: Since we are not doing a real DB migration in this PR, 
    // we assume createMandateAction will silently ignore or gracefully handle new fields until schema is pushed.
    const payload = {
      ...form,
      sectors,
      targetCompanies,
      geography: geography.join(", "),
      pocCc,
      // rename consultantNotes to searchNotes to match what exists in DB if needed, or pass both
      searchNotes: form.consultantNotes
    };

    const insertId = await createMandateAction(payload);
    router.push("/dashboard/mandates/" + insertId);
  };

  const inp = "w-full px-3 py-2 border border-gray-200 rounded text-sm outline-none focus:border-[#133255]";
  const section = "bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-6";
  const sectionHead = "bg-gray-50 border-b border-gray-200 px-5 py-3 font-bold text-xs uppercase tracking-wider text-[#133255]";

  const renderTags = (tags: string[], setter: React.Dispatch<React.SetStateAction<string[]>>) => (
    <div className="flex flex-wrap gap-2 mt-2">
      {tags.map((tag, i) => (
        <span key={i} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs flex items-center gap-1 border border-gray-200">
          {tag}
          <button type="button" onClick={() => removeTag(i, setter)} className="text-red-500 font-bold ml-1 hover:text-red-700">×</button>
        </span>
      ))}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <div className="flex items-center gap-2 text-sm text-gray-400 font-semibold mb-6">
        <Link href="/dashboard/mandates" className="hover:text-[#133255]">Mandates</Link>
        <span>/</span>
        <span className="text-gray-800">Create New Mandate</span>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Create New Mandate</h1>

      <form onSubmit={handleSubmit} className="flex flex-col">
        {/* SECTION 1 */}
        <div className={section}>
          <div className={sectionHead}>1 — Search Details</div>
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
              <label className="block text-xs font-bold text-gray-600 mb-1.5">CTC Range <span className="text-red-500">*</span></label>
              <input required value={form.ctc} onChange={(e) => setForm({...form, ctc: e.target.value})} type="text" className={inp} placeholder="e.g. ₹180-240L"/>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Experience <span className="text-red-500">*</span></label>
              <input required value={form.exp} onChange={(e) => setForm({...form, exp: e.target.value})} type="text" className={inp} placeholder="e.g. 15-20 yrs"/>
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Work Mode</label>
              <div className="flex gap-4 mt-2">
                {["On-site","Hybrid","Remote"].map((mode) => (
                  <label key={mode} className="flex items-center gap-1.5 text-sm cursor-pointer text-gray-700 font-semibold">
                    <input type="radio" name="workMode" checked={form.workMode === mode} onChange={() => setForm({...form, workMode: mode})}/>
                    {mode}
                  </label>
                ))}
              </div>
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Diversity Preference</label>
              <select value={form.diversity} onChange={(e) => setForm({...form, diversity: e.target.value})} className={inp + " bg-white"}>
                <option value="">No preference</option>
                <option value="Women candidates preferred">Women candidates preferred</option>
                <option value="Diversity hire required">Diversity hire required</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Target Sectors</label>
              <div className="border border-gray-200 rounded p-1 focus-within:border-[#133255] bg-white">
                <input type="text" onKeyDown={(e) => handleTagInput(e, setSectors)} className="w-full outline-none text-sm p-1.5" placeholder="Type + Enter..." />
              </div>
              {renderTags(sectors, setSectors)}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Target Companies</label>
              <div className="border border-gray-200 rounded p-1 focus-within:border-[#133255] bg-white">
                <input type="text" onKeyDown={(e) => handleTagInput(e, setTargetCompanies)} className="w-full outline-none text-sm p-1.5" placeholder="Type + Enter..." />
              </div>
              {renderTags(targetCompanies, setTargetCompanies)}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Geography</label>
              <div className="border border-gray-200 rounded p-1 focus-within:border-[#133255] bg-white">
                <input type="text" onKeyDown={(e) => handleTagInput(e, setGeography)} className="w-full outline-none text-sm p-1.5" placeholder="Add locations..." />
              </div>
              {renderTags(geography, setGeography)}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Attach Evaluation Framework</label>
              <select value={form.frameworkId} onChange={(e) => setForm({...form, frameworkId: e.target.value})} className={inp + " bg-white"}>
                <option value="">None (Optional)</option>
                {frameworks.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 2 */}
        <div className={section}>
          <div className={sectionHead}>2 — Client Contact</div>
          <div className="p-5 grid grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">POC Name <span className="text-red-500">*</span></label>
              <input required value={form.clientPOC} onChange={(e) => setForm({...form, clientPOC: e.target.value})} type="text" className={inp} placeholder="Client point of contact"/>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">POC Email <span className="text-red-500">*</span></label>
              <input required value={form.pocEmail} onChange={(e) => setForm({...form, pocEmail: e.target.value})} type="email" className={inp} placeholder="poc@company.com"/>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Additional Emails (CC)</label>
              <div className="border border-gray-200 rounded p-1 focus-within:border-[#133255] bg-white">
                <input type="email" onKeyDown={(e) => handleTagInput(e, setPocCc)} className="w-full outline-none text-sm p-1.5" placeholder="email + Enter..." />
              </div>
              {renderTags(pocCc, setPocCc)}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">POC Phone</label>
              <input value={form.pocPhone} onChange={(e) => setForm({...form, pocPhone: e.target.value})} type="text" className={inp} placeholder="+91 XXXXX XXXXX"/>
            </div>
          </div>
        </div>

        {/* SECTION 3 */}
        <div className={section}>
          <div className={sectionHead}>3 — Documents</div>
          <div className="p-5 grid grid-cols-3 gap-5">
            {[
              { id: 'jd', title: 'Job Description' },
              { id: 'notes', title: 'Client Interview Notes' },
              { id: 'docs', title: 'Additional Documents' }
            ].map((doc) => (
              <div key={doc.id} className="flex flex-col">
                <div className="text-sm font-bold text-[#133255] mb-2">{doc.title}</div>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 bg-white mb-2"
                     onClick={() => document.getElementById(`upload-${doc.id}`)?.click()}>
                  <div className="text-xl mb-1">📎</div>
                  <div className="text-xs font-bold text-gray-700">Click to upload</div>
                  <div className="text-[12px] text-gray-400 mt-1">PDF, DOCX, PPTX</div>
                </div>
                <input type="file" id={`upload-${doc.id}`} className="hidden" />
                <button 
                  type="button" 
                  onClick={() => simulateOCR(doc.id)}
                  disabled={isExtracting[doc.id] || extractedStatus[doc.id]}
                  className="w-full py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs font-bold border border-gray-200 disabled:opacity-50"
                >
                  {isExtracting[doc.id] ? "Extracting..." : extractedStatus[doc.id] ? "✓ Extracted" : "OCR & Extract"}
                </button>
                {extractedStatus[doc.id] && (
                  <div className="mt-2 bg-[#f8fafc] border border-gray-200 p-2 rounded text-[13px] text-gray-600">
                    <span className="font-bold text-[#133255] uppercase block mb-1">Summary</span>
                    Extracted text stored in database context.
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 4 */}
        <div className={section}>
          <div className={sectionHead}>4 — Internal Notes</div>
          <div className="p-5 grid grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Consultant Notes</label>
              <textarea 
                value={form.consultantNotes} 
                onChange={(e) => setForm({...form, consultantNotes: e.target.value})} 
                rows={4} 
                className={inp} 
                placeholder="Internal notes about the search..."
              ></textarea>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Open Questions</label>
              <textarea 
                value={form.openQuestions} 
                onChange={(e) => setForm({...form, openQuestions: e.target.value})} 
                rows={4} 
                className={inp} 
                placeholder="Questions to clarify with client..."
              ></textarea>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-2">
          <button type="button" onClick={() => router.push("/dashboard/mandates")} className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded text-sm font-bold hover:bg-gray-50">
            Cancel
          </button>
          <button type="button" className="px-5 py-2.5 border border-[#133255] text-[#133255] rounded text-sm font-bold hover:bg-blue-50">
            Save Draft
          </button>
          <button type="submit" className="px-6 py-2.5 bg-[#D8B15B] text-white rounded text-sm font-bold hover:bg-yellow-600 shadow-sm transition-colors">
            Create Mandate
          </button>
        </div>
      </form>
    </div>
  );
}