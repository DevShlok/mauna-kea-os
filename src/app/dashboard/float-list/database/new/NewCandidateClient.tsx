"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { addFloatListEntryAction, editFloatListEntryAction } from "@/app/actions";

export default function NewCandidateClient({ initialData }: { initialData?: any }) {
  const router = useRouter();
  const isEdit = !!initialData;
  const [form, setForm] = useState({ 
    name: initialData?.name || "", 
    company: initialData?.company || "", 
    designation: initialData?.designation || "", 
    email: initialData?.email || "", 
    mobile: initialData?.mobile || "", 
    location: initialData?.location || "", 
    exp: initialData?.exp || "", 
    ctc: initialData?.ctc || "", 
    expected: initialData?.expected || "", 
    notice: initialData?.notice !== null && initialData?.notice !== undefined ? String(initialData?.notice) : "90", 
    status: initialData?.status || "Active", 
    linkedin: initialData?.linkedin || "",
    targetCompany: initialData?.targetCompany || "", 
    currency: initialData?.currency || "INR", 
    cvFileName: initialData?.cvFileName || "", 
    notes: initialData?.notes || ""
  });
  
  const [quals, setQuals] = useState<string[]>(initialData?.qual || []);
  const [customQual, setCustomQual] = useState("");
  const [expTags, setExpTags] = useState<string[]>(initialData?.expTags || []);
  const [linkedinPdfFile, setLinkedinPdfFile] = useState<File | null>(null);
  const [cvPdfFile, setCvPdfFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const defaultQuals = ['CA','MBA','CFA','CS','B.Tech','M.Tech','Chartered Engineer','PhD','LLB'];
  const locations = ["Mumbai", "Delhi", "Bengaluru", "Chennai", "Hyderabad", "Pune", "Remote"];
  const currencies = ["INR", "USD", "GBP", "EUR", "SGD", "AED"];

  const handleCheckbox = (q: string) => {
    if (quals.includes(q)) setQuals(quals.filter(x => x !== q));
    else setQuals([...quals, q]);
  };

  const handleAddCustomQual = () => {
    if (customQual.trim() && !quals.includes(customQual.trim())) {
      setQuals([...quals, customQual.trim()]);
      setCustomQual("");
    }
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string[]>>, tags: string[]) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = e.currentTarget.value.trim();
      if (val && !tags.includes(val)) {
        setter([...tags, val]);
        e.currentTarget.value = '';
      }
    }
  };

  const removeTag = (t: string, setter: React.Dispatch<React.SetStateAction<string[]>>, tags: string[]) => {
    setter(tags.filter(x => x !== t));
  };

  const handleSave = async () => {
    if (!form.name || !form.linkedin || (!linkedinPdfFile && !isEdit) || !form.targetCompany) {
      alert("Please fill out all mandatory fields (Name, LinkedIn URL, Target Company, LinkedIn PDF)");
      return;
    }
    
    setIsSaving(true);
    try {
      const payload = {
        name: form.name,
        company: form.company,
        designation: form.designation,
        email: form.email,
        mobile: form.mobile,
        location: form.location,
        exp: form.exp ? Number(form.exp) : null,
        ctc: form.ctc ? Number(form.ctc) : null,
        expected: form.expected ? Number(form.expected) : null,
        notice: form.notice ? Number(form.notice) : null,
        status: form.status,
        qual: quals,
        expTags: expTags,
        linkedin: form.linkedin,
        targetCompany: form.targetCompany,
        currency: form.currency,
        cvFileName: cvPdfFile ? cvPdfFile.name : form.cvFileName,
        notes: form.notes
      };

      let candId = initialData?.id;

      if (isEdit) {
        await editFloatListEntryAction(candId, payload);
      } else {
        candId = await addFloatListEntryAction(payload);
      }

      if (linkedinPdfFile) {
        const fd = new FormData();
        fd.append("file", linkedinPdfFile);
        fd.append("candId", candId);
        await fetch("/api/upload-linkedin-pdf", { method: "POST", body: fd });
      }

      if (cvPdfFile) {
        const fd = new FormData();
        fd.append("file", cvPdfFile);
        fd.append("candId", candId);
        await fetch("/api/upload-cv", { method: "POST", body: fd });
      }

      router.push("/dashboard/float-list/database");
      router.refresh();
    } catch (e) {
      console.error(e);
      alert("Error saving candidate");
      setIsSaving(false);
    }
  };

  const statusColor = form.status === 'Active' ? 'text-green-600' : form.status === 'Passive' ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="max-w-screen-xl mx-auto pb-10">
      <div className="text-[11px] font-bold tracking-wide uppercase text-[#6b7a99] mb-6 flex gap-1 cursor-pointer">
        <Link href="/dashboard" className="hover:text-[#111]">Home</Link> / 
        <Link href="/dashboard/float-list/database" className="hover:text-[#111]">Float List</Link> / 
        <span className="text-[#111]">{isEdit ? "Edit Candidate" : "Add Candidate"}</span>
      </div>
      <div className="flex items-center justify-between mb-5">
        <div className="font-serif text-[22px] font-bold text-[#111]">{isEdit ? `Edit ${initialData.name}` : "Add New Candidate to Float List"}</div>
      </div>

      <div className="flex flex-col gap-4">
        {/* SECTION 1 */}
        <div className="bg-white border border-[#D4E0F0] rounded-[10px] overflow-hidden shadow-sm">
          <div className="bg-[#f4f7fd] px-5 py-3 text-[12px] font-bold uppercase tracking-wide text-[#123D8D] border-b border-[#D4E0F0]">
            1 — Personal Details
          </div>
          <div className="p-5 grid grid-cols-2 gap-5">
            <div>
              <label className="block text-[12px] font-bold tracking-wide uppercase text-[#6b7a99] mb-1.5">Candidate Name <span className="text-red-500">*</span></label>
              <input type="text" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} className="w-full h-[42px] border-[1.5px] border-[#D4E0F0] rounded-md px-3 text-[14px] outline-none bg-white focus:border-[#123D8D]" placeholder="Full Name" />
            </div>
            <div>
              <label className="block text-[12px] font-bold tracking-wide uppercase text-[#6b7a99] mb-1.5">LinkedIn Profile URL <span className="text-red-500">*</span></label>
              <input type="url" value={form.linkedin} onChange={e=>setForm({...form, linkedin:e.target.value})} className="w-full h-[42px] border-[1.5px] border-[#D4E0F0] rounded-md px-3 text-[14px] outline-none bg-white focus:border-[#123D8D]" placeholder="https://linkedin.com/in/..." />
            </div>
            <div>
              <label className="block text-[12px] font-bold tracking-wide uppercase text-[#6b7a99] mb-1.5">Mobile Number</label>
              <input type="text" value={form.mobile} onChange={e=>setForm({...form, mobile:e.target.value})} className="w-full h-[42px] border-[1.5px] border-[#D4E0F0] rounded-md px-3 text-[14px] outline-none bg-white focus:border-[#123D8D]" placeholder="+91 XXXXX XXXXX" />
            </div>
            <div>
              <label className="block text-[12px] font-bold tracking-wide uppercase text-[#6b7a99] mb-1.5">Email Address</label>
              <input type="email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} className="w-full h-[42px] border-[1.5px] border-[#D4E0F0] rounded-md px-3 text-[14px] outline-none bg-white focus:border-[#123D8D]" placeholder="email@domain.com" />
            </div>
            <div>
              <label className="block text-[12px] font-bold tracking-wide uppercase text-[#6b7a99] mb-1.5">Location</label>
              <select value={form.location} onChange={e=>setForm({...form, location:e.target.value})} className="w-full h-[42px] border-[1.5px] border-[#D4E0F0] rounded-md px-3 text-[14px] outline-none bg-white focus:border-[#123D8D]">
                <option value="">Select Location</option>
                {locations.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 2 */}
        <div className="bg-white border border-[#D4E0F0] rounded-[10px] overflow-hidden shadow-sm">
          <div className="bg-[#f4f7fd] px-5 py-3 text-[12px] font-bold uppercase tracking-wide text-[#123D8D] border-b border-[#D4E0F0]">
            2 — Professional Details
          </div>
          <div className="p-5">
            <div className="grid grid-cols-3 gap-5 mb-5">
              <div>
                <label className="block text-[12px] font-bold tracking-wide uppercase text-[#6b7a99] mb-1.5">Current Company</label>
                <input type="text" value={form.company} onChange={e=>setForm({...form, company:e.target.value})} className="w-full h-[42px] border-[1.5px] border-[#D4E0F0] rounded-md px-3 text-[14px] outline-none bg-white focus:border-[#123D8D]" placeholder="Company Name" />
              </div>
              <div>
                <label className="block text-[12px] font-bold tracking-wide uppercase text-[#6b7a99] mb-1.5">Current Designation</label>
                <input type="text" value={form.designation} onChange={e=>setForm({...form, designation:e.target.value})} className="w-full h-[42px] border-[1.5px] border-[#D4E0F0] rounded-md px-3 text-[14px] outline-none bg-white focus:border-[#123D8D]" placeholder="Title" />
              </div>
              <div>
                <label className="block text-[12px] font-bold tracking-wide uppercase text-[#6b7a99] mb-1.5">Target Company to Float <span className="text-red-500">*</span></label>
                <input type="text" value={form.targetCompany} onChange={e=>setForm({...form, targetCompany:e.target.value})} className="w-full h-[42px] border-[1.5px] border-[#D4E0F0] rounded-md px-3 text-[14px] outline-none bg-white focus:border-[#123D8D]" placeholder="e.g. HDFC Bank" />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-5 mb-5">
              <div>
                <label className="block text-[12px] font-bold tracking-wide uppercase text-[#6b7a99] mb-1.5">Total Experience (yrs)</label>
                <input type="number" value={form.exp} onChange={e=>setForm({...form, exp:e.target.value})} className="w-full h-[42px] border-[1.5px] border-[#D4E0F0] rounded-md px-3 text-[14px] outline-none bg-white focus:border-[#123D8D]" min="0" />
              </div>
              <div>
                <label className="block text-[12px] font-bold tracking-wide uppercase text-[#6b7a99] mb-1.5">Current CTC</label>
                <div className="flex gap-2">
                  <select value={form.currency} onChange={e=>setForm({...form, currency:e.target.value})} className="w-20 h-[42px] border-[1.5px] border-[#D4E0F0] rounded-md px-2 text-[14px] outline-none bg-white focus:border-[#123D8D]">
                    {currencies.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input type="number" value={form.ctc} onChange={e=>setForm({...form, ctc:e.target.value})} className="flex-1 h-[42px] border-[1.5px] border-[#D4E0F0] rounded-md px-3 text-[14px] outline-none bg-white focus:border-[#123D8D]" placeholder="Amount" />
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-bold tracking-wide uppercase text-[#6b7a99] mb-1.5">Expected CTC</label>
                <input type="number" value={form.expected} onChange={e=>setForm({...form, expected:e.target.value})} className="w-full h-[42px] border-[1.5px] border-[#D4E0F0] rounded-md px-3 text-[14px] outline-none bg-white focus:border-[#123D8D]" placeholder="Amount" />
              </div>
              <div>
                <label className="block text-[12px] font-bold tracking-wide uppercase text-[#6b7a99] mb-1.5">Notice Period (days)</label>
                <input type="number" value={form.notice} onChange={e=>setForm({...form, notice:e.target.value})} className="w-full h-[42px] border-[1.5px] border-[#D4E0F0] rounded-md px-3 text-[14px] outline-none bg-white focus:border-[#123D8D]" min="0" max="365" />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-5">
              <div>
                <label className="block text-[12px] font-bold tracking-wide uppercase text-[#6b7a99] mb-1.5">Activity Status</label>
                <select value={form.status} onChange={e=>setForm({...form, status:e.target.value})} className={`w-full h-[42px] border-[1.5px] border-[#D4E0F0] rounded-md px-3 text-[14px] font-bold outline-none bg-white focus:border-[#123D8D] ${statusColor}`}>
                  <option className="text-green-600">Active</option>
                  <option className="text-yellow-600">Passive</option>
                  <option className="text-red-600">Not Interested</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3 */}
        <div className="bg-white border border-[#D4E0F0] rounded-[10px] overflow-hidden shadow-sm">
          <div className="bg-[#f4f7fd] px-5 py-3 text-[12px] font-bold uppercase tracking-wide text-[#123D8D] border-b border-[#D4E0F0]">
            3 — Tags: Qualifications
          </div>
          <div className="p-5">
            <div className="flex flex-wrap gap-3 mb-4">
              {defaultQuals.map(q => (
                <label key={q} className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-[#D4E0F0] bg-[#f4f7fd] text-[13px] text-[#444] cursor-pointer hover:bg-[#e6edf8] hover:border-[#123D8D] transition-colors">
                  <input type="checkbox" checked={quals.includes(q)} onChange={() => handleCheckbox(q)} className="w-3.5 h-3.5 accent-[#123D8D]" />
                  {q}
                </label>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input type="text" value={customQual} onChange={e=>setCustomQual(e.target.value)} onKeyDown={(e) => { if(e.key==='Enter') handleAddCustomQual(); }} className="h-9 w-64 border-[1.5px] border-[#D4E0F0] rounded-md px-3 text-[13px] outline-none bg-white focus:border-[#123D8D]" placeholder="Add custom qualification..." />
              <button onClick={handleAddCustomQual} className="px-3 py-1.5 rounded-md text-[13px] font-semibold text-[#6b7a99] hover:bg-[#f4f7fd] transition-all border border-[#D4E0F0]">Add</button>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {quals.map(q => (
                <span key={q} className="px-2 py-1 bg-[#DCE5F4] text-[#123D8D] rounded-[12px] text-[12px] font-semibold flex items-center gap-1.5">
                  {q} <span className="cursor-pointer font-bold opacity-60 hover:opacity-100" onClick={() => removeTag(q, setQuals, quals)}>×</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION 4 */}
        <div className="bg-white border border-[#D4E0F0] rounded-[10px] overflow-hidden shadow-sm">
          <div className="bg-[#f4f7fd] px-5 py-3 text-[12px] font-bold uppercase tracking-wide text-[#123D8D] border-b border-[#D4E0F0]">
            4 — Tags: Experience
          </div>
          <div className="p-5">
            <p className="text-[12px] text-[#6b7a99] mb-2.5">Add each experience as "Title – Company"</p>
            <div className="min-h-[42px] border-[1.5px] border-[#D4E0F0] rounded-md p-1.5 bg-white cursor-text flex flex-wrap gap-1.5 items-center focus-within:border-[#123D8D] transition-colors">
              {expTags.map(t => (
                <span key={t} className="px-2.5 py-1 bg-[#DCE5F4] text-[#123D8D] rounded-[12px] text-[12px] font-semibold flex items-center gap-1.5">
                  {t} <span className="cursor-pointer font-bold opacity-60 hover:opacity-100" onClick={() => removeTag(t, setExpTags, expTags)}>×</span>
                </span>
              ))}
              <input type="text" className="border-none outline-none text-[14px] min-w-[200px] flex-1 bg-transparent h-8 px-2" placeholder="e.g. CFO – HDFC Bank, then Enter..." onKeyDown={e => handleAddTag(e, setExpTags, expTags)} />
            </div>
          </div>
        </div>

        {/* SECTION 5 */}
        <div className="bg-white border border-[#D4E0F0] rounded-[10px] overflow-hidden shadow-sm">
          <div className="bg-[#f4f7fd] px-5 py-3 text-[12px] font-bold uppercase tracking-wide text-[#123D8D] border-b border-[#D4E0F0]">
            5 — Additional Notes
          </div>
          <div className="p-5">
            <textarea rows={3} value={form.notes} onChange={e=>setForm({...form, notes:e.target.value})} className="w-full border-[1.5px] border-[#D4E0F0] rounded-md p-3 text-[14px] outline-none bg-white focus:border-[#123D8D] resize-vertical min-h-[80px]" placeholder="Any extra information..."></textarea>
          </div>
        </div>

        {/* SECTION 6 */}
        <div className="bg-white border border-[#D4E0F0] rounded-[10px] overflow-hidden shadow-sm">
          <div className="bg-[#f4f7fd] px-5 py-3 text-[12px] font-bold uppercase tracking-wide text-[#123D8D] border-b border-[#D4E0F0]">
            6 — Documents
          </div>
          <div className="p-5 grid grid-cols-2 gap-8">
            <div>
              <label className="block text-[12px] font-bold tracking-wide uppercase text-[#6b7a99] mb-2">LinkedIn Profile PDF <span className="text-red-500">*</span></label>
              <label className="border-2 border-dashed border-[#D4E0F0] rounded-[8px] p-6 text-center cursor-pointer hover:border-[#123D8D] hover:bg-[#DCE5F4] bg-[#f4f7fd] transition-all block relative">
                <input type="file" accept="application/pdf" className="hidden" onChange={e => setLinkedinPdfFile(e.target.files?.[0] || null)} />
                <div className="text-[28px] opacity-40 mb-2">📘</div>
                <div className="text-[13px] text-[#6b7a99]">{linkedinPdfFile ? 'Change PDF' : (isEdit && initialData.linkedinPdf ? 'Replace Existing PDF' : 'Click to upload LinkedIn PDF')}</div>
                {linkedinPdfFile && <div className="text-[14px] font-bold text-[#111] mt-2 overflow-hidden text-ellipsis whitespace-nowrap">{linkedinPdfFile.name}</div>}
              </label>
              {isEdit && initialData.linkedinPdf && !linkedinPdfFile && (
                <div className="mt-2 text-[12px] text-center">
                  <a href={initialData.linkedinPdf} target="_blank" className="text-[#123D8D] hover:underline font-semibold flex items-center justify-center gap-1">
                    <span></span> View Existing LinkedIn PDF
                  </a>
                </div>
              )}
            </div>
            <div>
              <label className="block text-[12px] font-bold tracking-wide uppercase text-[#6b7a99] mb-2">Upload CV</label>
              <label className="border-2 border-dashed border-[#D4E0F0] rounded-[8px] p-6 text-center cursor-pointer hover:border-[#123D8D] hover:bg-[#DCE5F4] bg-[#f4f7fd] transition-all block relative">
                <input type="file" accept="application/pdf,.doc,.docx" className="hidden" onChange={e => setCvPdfFile(e.target.files?.[0] || null)} />
                <div className="text-[28px] opacity-40 mb-2">📄</div>
                <div className="text-[13px] text-[#6b7a99]">{cvPdfFile ? 'Change CV' : (isEdit && initialData.hasCv ? 'Replace Existing CV' : 'Click to upload CV')}</div>
                {cvPdfFile && <div className="text-[14px] font-bold text-[#111] mt-2 overflow-hidden text-ellipsis whitespace-nowrap">{cvPdfFile.name}</div>}
              </label>
              {isEdit && initialData.hasCv && !cvPdfFile && (
                <div className="mt-2 text-[12px] text-center">
                  <a href={`/uploads/cvs/${initialData.id}.pdf`} target="_blank" className="text-[#123D8D] hover:underline font-semibold flex items-center justify-center gap-1">
                    <span></span> View Existing CV
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      <div className="flex gap-2.5 justify-end py-6">
        <button onClick={() => router.push('/dashboard/float-list/database')} className="px-5 py-2.5 rounded-md text-[14px] font-semibold text-[#6b7a99] border border-[#D4E0F0] hover:bg-[#f4f7fd] transition-all">Cancel</button>
        <button disabled={isSaving} onClick={handleSave} className="px-6 py-2.5 rounded-md text-[14px] font-bold bg-[#D8B15B] text-[#0d2f6e] hover:bg-[#e8c97a] transition-all">
          {isSaving ? "Saving..." : (isEdit ? "Update Candidate" : "Add to Float List")}
        </button>
      </div>
    </div>
  );
}
