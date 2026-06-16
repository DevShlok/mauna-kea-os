"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { addFloatListEntryAction, editFloatListEntryAction, bulkAddSubmissionAction } from "@/app/actions";

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
    fixedCtc: initialData?.fixedCtc || "",
    variableCtc: initialData?.variableCtc || "",
    expected: initialData?.expected || "", 
    tenure: initialData?.tenure || "", 
    notice: initialData?.notice !== null && initialData?.notice !== undefined ? String(initialData?.notice) : "90", 
    status: initialData?.status || "Active", 
    linkedin: initialData?.linkedin || "",
    targetCompany: initialData?.targetCompany || "", 
    currency: initialData?.currency || "INR", 
    cvFileName: initialData?.cvFileName || "", 
    notes: initialData?.notes || ""
  });
  
  const [quals, setQuals] = useState<any[]>(() => {
    return (initialData?.qual || []).map((q: any) => {
      if (typeof q === 'string') return { degree: q, institute: '', year: '' };
      return q;
    });
  });
  const [newQual, setNewQual] = useState({ degree: "", institute: "", year: "" });
  const [expTags, setExpTags] = useState<string[]>(initialData?.expTags || []);
  const [dreamRoles, setDreamRoles] = useState<string[]>(initialData?.dreamRoles || []);
  const [dreamCompanies, setDreamCompanies] = useState<string[]>(initialData?.dreamCos || []);
  const [linkedinPdfFile, setLinkedinPdfFile] = useState<File | null>(null);
  const [cvPdfFile, setCvPdfFile] = useState<File | null>(null);
  const getInitialFiles = () => {
    let files = initialData?.files ? [...initialData.files] : [];
    
    if (initialData?.hasCv && initialData?.cvFileName?.startsWith('http')) {
      const hasCvInFiles = files.some((f: any) => f.fileType.toLowerCase().includes('cv') || f.fileType.toLowerCase().includes('resume'));
      if (!hasCvInFiles) {
        files.push({
          id: -1,
          fileType: 'CV / Resume',
          fileName: initialData.cvFileName.split('/').pop() || 'Legacy_CV.pdf',
          fileUrl: initialData.cvFileName,
          createdAt: initialData.createdAt || new Date().toISOString()
        });
      }
    }

    if (initialData?.linkedinPdf && initialData?.linkedinPdf.startsWith('http')) {
      const hasLiInFiles = files.some((f: any) => f.fileType.toLowerCase().includes('linkedin'));
      if (!hasLiInFiles) {
        files.push({
          id: -2,
          fileType: 'LinkedIn Profile',
          fileName: 'Legacy_LinkedIn.pdf',
          fileUrl: initialData.linkedinPdf,
          createdAt: initialData.createdAt || new Date().toISOString()
        });
      }
    }
    return files;
  };

  const [candidateFiles, setCandidateFiles] = useState<any[]>(getInitialFiles());
  const [deleteConfirmation, setDeleteConfirmation] = useState<{fileId: number, fileName: string} | null>(null);
  const [profilePicBase64, setProfilePicBase64] = useState<string | null>(initialData?.profilePic || null);
  const [isSaving, setIsSaving] = useState(false);
  const [showAdditional, setShowAdditional] = useState(!!isEdit);

  const defaultQuals = ['CA','MBA','CFA','CS','B.Tech','M.Tech','Chartered Engineer','PhD','LLB'];
  const locations = ["Mumbai", "Delhi", "Bengaluru", "Chennai", "Hyderabad", "Pune", "Remote"];
  const currencies = ["INR", "USD", "GBP", "EUR", "SGD", "AED"];

  const handleDeleteFile = async (fileId: number, fileName: string) => {
    setDeleteConfirmation({ fileId, fileName });
  };

  const confirmDeleteFile = async () => {
    if (!deleteConfirmation) return;
    const { fileId } = deleteConfirmation;
    try {
      const res = await fetch(`/api/candidate-files?id=${fileId}`, { method: 'DELETE' });
      if (res.ok) {
        setCandidateFiles(prev => prev.filter(f => f.id !== fileId));
      } else {
        alert("Failed to delete file");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting file");
    } finally {
      setDeleteConfirmation(null);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 300;
        const MAX_HEIGHT = 300;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        setProfilePicBase64(dataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleAddQual = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!newQual.degree) {
      alert("Please enter the degree/qualification.");
      return;
    }
    setQuals([...quals, newQual]);
    setNewQual({ degree: "", institute: "", year: "" });
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
    const hasAtLeastOnePrimary = form.name || form.linkedin || form.targetCompany || linkedinPdfFile || (isEdit && initialData?.linkedinPdf);
    if (!hasAtLeastOnePrimary) {
      alert("Please fill out at least one of the Primary Details (Name, LinkedIn URL, Target Company, or LinkedIn PDF)");
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
        tenure: form.tenure ? Number(form.tenure) : null,
        ctc: form.ctc ? Number(form.ctc) : null,
        fixedCtc: form.fixedCtc ? Number(form.fixedCtc) : null,
        variableCtc: form.variableCtc ? Number(form.variableCtc) : null,
        expected: form.expected ? Number(form.expected) : null,
        notice: form.notice ? Number(form.notice) : null,
        status: form.status,
        qual: quals,
        expTags: expTags,
        dreamRoles: dreamRoles,
        dreamCos: dreamCompanies,
        linkedin: form.linkedin,
        targetCompany: form.targetCompany,
        currency: form.currency,
        cvFileName: cvPdfFile ? cvPdfFile.name : form.cvFileName,
        notes: form.notes,
        profilePic: profilePicBase64
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

      if (isEdit) {
        router.push(`/dashboard/candidates/${candId}`);
      } else {
        router.push("/dashboard/candidates");
      }
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
        <Link href="/dashboard/candidates" className="hover:text-[#111]">Candidate DB</Link> / 
        <span className="text-[#111]">{isEdit ? "Edit Candidate" : "Add Candidate"}</span>
      </div>
      <div className="flex items-center justify-between mb-5">
        <div className="font-serif text-[22px] font-bold text-[#111]">{isEdit ? `Edit ${initialData.name}` : "Add New Candidate"}</div>
      </div>

      <div className="flex flex-col gap-4">

        {/* ××××××××××××××××××××××××××××××××××××××××××× */}
        {/* PRIMARY DETAILS                             */}
        {/* ××××××××××××××××××××××××××××××××××××××××××× */}
        <div className="bg-white border-2 border-[#123D8D] rounded-[10px] overflow-hidden shadow-sm">
          <div className="bg-[#123D8D] px-5 py-3 text-[12px] font-bold uppercase tracking-wide text-white border-b border-[#0d2f6e] flex items-center gap-2">
            <span className="text-red-300">●</span> Primary Details
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 gap-5 mb-5">
              <div>
                <label className="block text-[12px] font-bold tracking-wide uppercase text-[#6b7a99] mb-1.5">Candidate Name</label>
                <input type="text" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} className="w-full h-[42px] border-[1.5px] border-[#D4E0F0] rounded-md px-3 text-[14px] outline-none bg-white focus:border-[#123D8D]" placeholder="Full Name" />
              </div>
              <div>
                <label className="block text-[12px] font-bold tracking-wide uppercase text-[#6b7a99] mb-1.5">LinkedIn Profile URL</label>
                <input type="url" value={form.linkedin} onChange={e=>setForm({...form, linkedin:e.target.value})} className="w-full h-[42px] border-[1.5px] border-[#D4E0F0] rounded-md px-3 text-[14px] outline-none bg-white focus:border-[#123D8D]" placeholder="https://linkedin.com/in/..." />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-[12px] font-bold tracking-wide uppercase text-[#6b7a99] mb-1.5">Target Company to Float</label>
                <input type="text" value={form.targetCompany} onChange={e=>setForm({...form, targetCompany:e.target.value})} className="w-full h-[42px] border-[1.5px] border-[#D4E0F0] rounded-md px-3 text-[14px] outline-none bg-white focus:border-[#123D8D]" placeholder="e.g. HDFC Bank" />
              </div>
              <div>
                <label className="block text-[12px] font-bold tracking-wide uppercase text-[#6b7a99] mb-2">LinkedIn Profile PDF</label>
                <label className="border-2 border-dashed border-[#D4E0F0] rounded-[8px] p-4 text-center cursor-pointer hover:border-[#123D8D] hover:bg-[#DCE5F4] bg-[#f4f7fd] transition-all block relative">
                  <input type="file" accept="application/pdf" className="hidden" onChange={e => setLinkedinPdfFile(e.target.files?.[0] || null)} />
                  <div className="text-[13px] text-[#6b7a99]">{linkedinPdfFile ? '📘 Change PDF' : '📘 Click to upload LinkedIn Profile'}</div>
                  {linkedinPdfFile && <div className="text-[13px] font-bold text-[#111] mt-1 overflow-hidden text-ellipsis whitespace-nowrap">{linkedinPdfFile.name}</div>}
                </label>
              </div>
            </div>
            
            {/* Profile Picture Upload */}
            <div className="mt-5 border-t border-[#D4E0F0] pt-5">
              <label className="block text-[12px] font-bold tracking-wide uppercase text-[#6b7a99] mb-2"></label>
              <div className="flex items-center gap-5">
                <div className="w-[80px] h-[80px] rounded-full bg-[#f4f7fd] border-2 border-dashed border-[#D4E0F0] flex items-center justify-center overflow-hidden shrink-0">
                  {profilePicBase64 ? (
                    <img src={profilePicBase64} alt="Profile preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[20px] opacity-40">👤</span>
                  )}
                </div>
                <label className="border-[1.5px] border-[#D4E0F0] rounded-[6px] px-4 py-2 text-[13px] font-bold text-[#6b7a99] hover:bg-[#f4f7fd] cursor-pointer transition-colors cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  Upload Image
                </label>
                {profilePicBase64 && (
                  <button onClick={() => setProfilePicBase64(null)} className="text-[13px] text-red-500 font-bold hover:underline">Remove</button>
                )}
              </div>
            </div>
            
          </div>
        </div>

        {/* ××××××××××××××××××××××××××××××××××××××××××× */}
        {/* ADDITIONAL DETAILS                          */}
        {/* ××××××××××××××××××××××××××××××××××××××××××× */}
        <div className="bg-white border border-[#D4E0F0] rounded-[10px] overflow-hidden shadow-sm">
          <div 
            onClick={() => setShowAdditional(!showAdditional)}
            className="bg-[#f4f7fd] px-5 py-3 text-[12px] font-bold uppercase tracking-wide text-[#123D8D] border-b border-[#D4E0F0] flex items-center justify-between cursor-pointer hover:bg-[#e8eef8] transition-colors select-none"
          >
            <span className="flex items-center gap-2">
              <span className={`transition-transform duration-200 inline-block ${showAdditional ? 'rotate-90' : 'rotate-0'}`}>▶</span>
              Additional Details
            </span>
            <span className="text-[10px] font-normal normal-case text-[#6b7a99]">{showAdditional ? 'Click to collapse' : 'Click to expand — Optional'}</span>
          </div>
          {showAdditional && <div className="p-5">

            {/* Contact & Location */}
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#9ca8be] mb-3">Contact & Location</div>
            <div className="grid grid-cols-3 gap-5 mb-6">
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

            {/* Professional */}
            <div className="border-t border-[#f0f0f0] pt-5 mb-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#9ca8be] mb-3">Professional Details</div>
            </div>
            <div className="grid grid-cols-3 gap-5 mb-6">
              <div>
                <label className="block text-[12px] font-bold tracking-wide uppercase text-[#6b7a99] mb-1.5">Current Company</label>
                <input type="text" value={form.company} onChange={e=>setForm({...form, company:e.target.value})} className="w-full h-[42px] border-[1.5px] border-[#D4E0F0] rounded-md px-3 text-[14px] outline-none bg-white focus:border-[#123D8D]" placeholder="Company Name" />
              </div>
              <div>
                <label className="block text-[12px] font-bold tracking-wide uppercase text-[#6b7a99] mb-1.5">Current Designation</label>
                <input type="text" value={form.designation} onChange={e=>setForm({...form, designation:e.target.value})} className="w-full h-[42px] border-[1.5px] border-[#D4E0F0] rounded-md px-3 text-[14px] outline-none bg-white focus:border-[#123D8D]" placeholder="Title" />
              </div>
              <div>
                <label className="block text-[12px] font-bold tracking-wide uppercase text-[#6b7a99] mb-1.5">Total Experience (yrs)</label>
                <input type="number" value={form.exp} onChange={e=>setForm({...form, exp:e.target.value})} className="w-full h-[42px] border-[1.5px] border-[#D4E0F0] rounded-md px-3 text-[14px] outline-none bg-white focus:border-[#123D8D]" min="0" />
              </div>
              <div>
                <label className="block text-[12px] font-bold tracking-wide uppercase text-[#6b7a99] mb-1.5">Tenure in current company (yrs)</label>
                <input type="number" value={form.tenure} onChange={e=>setForm({...form, tenure:e.target.value})} className="w-full h-[42px] border-[1.5px] border-[#D4E0F0] rounded-md px-3 text-[14px] outline-none bg-white focus:border-[#123D8D]" min="0" step="0.1" />
              </div>
            </div>

            {/* Compensation & Status */}
            <div className="border-t border-[#f0f0f0] pt-5 mb-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#9ca8be] mb-3">Compensation & Status</div>
            </div>
            <div className="grid grid-cols-3 gap-5 mb-6">
              <div>
                <label className="block text-[12px] font-bold tracking-wide uppercase text-[#6b7a99] mb-1.5">Current CTC (Total)</label>
                <div className="flex gap-2">
                  <select value={form.currency} onChange={e=>setForm({...form, currency:e.target.value})} className="w-20 h-[42px] border-[1.5px] border-[#D4E0F0] rounded-md px-2 text-[14px] outline-none bg-white focus:border-[#123D8D]">
                    {currencies.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input type="number" value={form.ctc} onChange={e=>setForm({...form, ctc:e.target.value})} className="flex-1 h-[42px] border-[1.5px] border-[#D4E0F0] rounded-md px-3 text-[14px] outline-none bg-white focus:border-[#123D8D]" placeholder="Amount" />
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-bold tracking-wide uppercase text-[#6b7a99] mb-1.5">Fixed CTC</label>
                <input type="number" value={form.fixedCtc} onChange={e=>setForm({...form, fixedCtc:e.target.value})} className="w-full h-[42px] border-[1.5px] border-[#D4E0F0] rounded-md px-3 text-[14px] outline-none bg-white focus:border-[#123D8D]" placeholder="Amount" />
              </div>
              <div>
                <label className="block text-[12px] font-bold tracking-wide uppercase text-[#6b7a99] mb-1.5">Variable CTC</label>
                <input type="number" value={form.variableCtc} onChange={e=>setForm({...form, variableCtc:e.target.value})} className="w-full h-[42px] border-[1.5px] border-[#D4E0F0] rounded-md px-3 text-[14px] outline-none bg-white focus:border-[#123D8D]" placeholder="Amount" />
              </div>
              <div>
                <label className="block text-[12px] font-bold tracking-wide uppercase text-[#6b7a99] mb-1.5">Expected CTC</label>
                <input type="number" value={form.expected} onChange={e=>setForm({...form, expected:e.target.value})} className="w-full h-[42px] border-[1.5px] border-[#D4E0F0] rounded-md px-3 text-[14px] outline-none bg-white focus:border-[#123D8D]" placeholder="Amount" />
              </div>
              <div>
                <label className="block text-[12px] font-bold tracking-wide uppercase text-[#6b7a99] mb-1.5">Notice Period (days)</label>
                <input type="number" value={form.notice} onChange={e=>setForm({...form, notice:e.target.value})} className="w-full h-[42px] border-[1.5px] border-[#D4E0F0] rounded-md px-3 text-[14px] outline-none bg-white focus:border-[#123D8D]" min="0" max="365" />
              </div>
              <div>
                <label className="block text-[12px] font-bold tracking-wide uppercase text-[#6b7a99] mb-1.5">Activity Status</label>
                <select value={form.status} onChange={e=>setForm({...form, status:e.target.value})} className={`w-full h-[42px] border-[1.5px] border-[#D4E0F0] rounded-md px-3 text-[14px] font-bold outline-none bg-white focus:border-[#123D8D] ${statusColor}`}>
                  <option className="text-green-600">Active</option>
                  <option className="text-yellow-600">Passive</option>
                  <option className="text-red-600">Not Interested</option>
                </select>
              </div>
            </div>

            {/* Qualifications */}
            <div className="border-t border-[#f0f0f0] pt-5 mb-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#9ca8be] mb-3">Qualifications</div>
            </div>
            <div className="grid grid-cols-4 gap-3 mb-4">
              <input type="text" value={newQual.degree} onChange={e=>setNewQual({...newQual, degree: e.target.value})} className="h-9 border-[1.5px] border-[#D4E0F0] rounded-md px-3 text-[13px] outline-none bg-white focus:border-[#123D8D]" placeholder="Degree (e.g. MBA)" />
              <input type="text" value={newQual.institute} onChange={e=>setNewQual({...newQual, institute: e.target.value})} className="h-9 border-[1.5px] border-[#D4E0F0] rounded-md px-3 text-[13px] outline-none bg-white focus:border-[#123D8D]" placeholder="Institute (e.g. ISB Hyderabad)" />
              <input type="text" value={newQual.year} onChange={e=>setNewQual({...newQual, year: e.target.value})} className="h-9 border-[1.5px] border-[#D4E0F0] rounded-md px-3 text-[13px] outline-none bg-white focus:border-[#123D8D]" placeholder="Year (e.g. 2012)" />
              <button onClick={handleAddQual} type="button" className="h-9 px-3 rounded-md text-[13px] font-semibold text-[#123D8D] bg-[#DCE5F4] hover:bg-[#c5d3ec] transition-all border border-[#bacce6]">Add Qualification</button>
            </div>
            <div className="flex flex-col gap-2 mb-6">
              {quals.map((q, idx) => (
                <div key={idx} className="flex justify-between items-center bg-[#f8fafc] border border-[#e2e8f0] px-4 py-2.5 rounded-lg">
                  <div>
                    <span className="font-bold text-[#111]">{q.degree}</span>
                    {(q.institute || q.year) && <span className="text-[#6b7a99] text-[13px]"> · {q.institute}{q.institute && q.year ? ' · ' : ''}{q.year}</span>}
                  </div>
                  <span className="cursor-pointer font-bold text-red-400 hover:text-red-600 px-2" onClick={() => setQuals(quals.filter((_, i) => i !== idx))}>×</span>
                </div>
              ))}
            </div>

            {/* Experience Tags */}
            <div className="border-t border-[#f0f0f0] pt-5 mb-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#9ca8be] mb-3">Prior Experience</div>
            </div>
            <p className="text-[12px] text-[#6b7a99] mb-2.5">Add each experience as &quot;Title - Company&quot;</p>
            <div className="min-h-[42px] border-[1.5px] border-[#D4E0F0] rounded-md p-1.5 bg-white cursor-text flex flex-wrap gap-1.5 items-center focus-within:border-[#123D8D] transition-colors mb-6">
              {expTags.map(t => (
                <span key={t} className="px-2.5 py-1 bg-[#DCE5F4] text-[#123D8D] rounded-[12px] text-[12px] font-semibold flex items-center gap-1.5">
                  {t} <span className="cursor-pointer font-bold opacity-60 hover:opacity-100" onClick={() => removeTag(t, setExpTags, expTags)}>×</span>
                </span>
              ))}
              <input type="text" className="border-none outline-none text-[14px] min-w-[200px] flex-1 bg-transparent h-8 px-2" placeholder="e.g. CFO - HDFC Bank, then Enter..." onKeyDown={e => handleAddTag(e, setExpTags, expTags)} />
            </div>

            {/* Career Aspirations */}
            <div className="border-t border-[#f0f0f0] pt-5 mb-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#9ca8be] mb-3">Career Aspirations</div>
            </div>
            <div className="grid grid-cols-2 gap-5 mb-6">
              <div>
                <label className="block text-[12px] font-bold tracking-wide uppercase text-[#6b7a99] mb-1.5">Dream Roles</label>
                <div className="min-h-[42px] border-[1.5px] border-[#D4E0F0] rounded-md p-1.5 bg-white cursor-text flex flex-wrap gap-1.5 items-center focus-within:border-[#123D8D] transition-colors">
                  {dreamRoles.map(t => (
                    <span key={t} className="px-2.5 py-1 bg-yellow-100 text-yellow-800 border border-yellow-200 rounded-[12px] text-[12px] font-semibold flex items-center gap-1.5">
                      {t} <span className="cursor-pointer font-bold opacity-60 hover:opacity-100 hover:text-red-500" onClick={() => removeTag(t, setDreamRoles, dreamRoles)}>×</span>
                    </span>
                  ))}
                  <input type="text" className="border-none outline-none text-[14px] min-w-[120px] flex-1 bg-transparent h-8 px-2" placeholder="e.g. CFO, then Enter..." onKeyDown={e => handleAddTag(e, setDreamRoles, dreamRoles)} />
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-bold tracking-wide uppercase text-[#6b7a99] mb-1.5">Dream Companies</label>
                <div className="min-h-[42px] border-[1.5px] border-[#D4E0F0] rounded-md p-1.5 bg-white cursor-text flex flex-wrap gap-1.5 items-center focus-within:border-[#123D8D] transition-colors">
                  {dreamCompanies.map(t => (
                    <span key={t} className="px-2.5 py-1 bg-yellow-100 text-yellow-800 border border-yellow-200 rounded-[12px] text-[12px] font-semibold flex items-center gap-1.5">
                      {t} <span className="cursor-pointer font-bold opacity-60 hover:opacity-100 hover:text-red-500" onClick={() => removeTag(t, setDreamCompanies, dreamCompanies)}>×</span>
                    </span>
                  ))}
                  <input type="text" className="border-none outline-none text-[14px] min-w-[120px] flex-1 bg-transparent h-8 px-2" placeholder="e.g. Kotak, then Enter..." onKeyDown={e => handleAddTag(e, setDreamCompanies, dreamCompanies)} />
                </div>
              </div>
            </div>

            {/* Documents & Notes */}
            <div className="border-t border-[#f0f0f0] pt-5 mb-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#9ca8be] mb-3">Documents & Notes</div>
            </div>
            <div className="grid grid-cols-2 gap-8 mb-6">
              <div>
                <label className="block text-[12px] font-bold tracking-wide uppercase text-[#6b7a99] mb-2">Upload CV</label>
                <label className="border-2 border-dashed border-[#D4E0F0] rounded-[8px] p-6 text-center cursor-pointer hover:border-[#123D8D] hover:bg-[#DCE5F4] bg-[#f4f7fd] transition-all block relative">
                  <input type="file" accept="application/pdf,.doc,.docx" className="hidden" onChange={e => setCvPdfFile(e.target.files?.[0] || null)} />
                  <div className="text-[28px] opacity-40 mb-2">📄</div>
                  <div className="text-[13px] text-[#6b7a99]">{cvPdfFile ? 'Change CV' : 'Click to upload CV'}</div>
                  {cvPdfFile && <div className="text-[14px] font-bold text-[#111] mt-2 overflow-hidden text-ellipsis whitespace-nowrap">{cvPdfFile.name}</div>}
                </label>
              </div>
              <div>
                <label className="block text-[12px] font-bold tracking-wide uppercase text-[#6b7a99] mb-2">Additional Notes</label>
                <textarea rows={5} value={form.notes} onChange={e=>setForm({...form, notes:e.target.value})} className="w-full border-[1.5px] border-[#D4E0F0] rounded-md p-3 text-[14px] outline-none bg-white focus:border-[#123D8D] resize-vertical h-[155px]" placeholder="Any extra information..."></textarea>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden mt-6 mb-2">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-700">
                  <tr>
                    <th className="px-4 py-2 border-r border-gray-200 w-32">Type</th>
                    <th className="px-4 py-2 border-r border-gray-200 w-32">Date</th>
                    <th className="px-4 py-2 border-r border-gray-200">File</th>
                    <th className="px-4 py-2 w-16 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {candidateFiles.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-gray-400 italic">
                        No files uploaded yet. Upload a CV or LinkedIn Profile above.
                      </td>
                    </tr>
                  ) : (
                    candidateFiles.map((file) => {
                      const dateStr = new Date(file.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }).replace(/ /g, '-');
                      return (
                        <tr key={file.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-2 border-r border-gray-200 font-medium text-gray-900">{file.fileType}</td>
                          <td className="px-4 py-2 border-r border-gray-200 text-gray-600">{dateStr}</td>
                          <td className="px-4 py-2 border-r border-gray-200">
                            <a href={file.fileUrl} target="_blank" rel="noreferrer" className="text-[#123D8D] hover:underline hover:text-blue-800 break-all">
                              {file.fileName}
                            </a>
                          </td>
                          <td className="px-4 py-2 text-center">
                            {file.id > 0 ? (
                              <button 
                                onClick={() => handleDeleteFile(file.id, file.fileName)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded transition-colors"
                                title="Delete File"
                              >
                                ❌
                              </button>
                            ) : (
                              <span className="text-gray-400 text-xs" title="Legacy files cannot be deleted from here">--</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

          </div>}
        </div>

      </div>

      <div className="flex gap-2.5 justify-end py-6">
        <button onClick={() => router.push('/dashboard/candidates')} className="px-5 py-2.5 rounded-md text-[14px] font-semibold text-[#6b7a99] border border-[#D4E0F0] hover:bg-[#f4f7fd] transition-all">Cancel</button>
        <button disabled={isSaving} onClick={handleSave} className="px-6 py-2.5 rounded-md text-[14px] font-bold bg-[#D8B15B] text-[#0d2f6e] hover:bg-[#e8c97a] transition-all">
          {isSaving ? "Saving..." : (isEdit ? "Update Candidate" : "Add Candidate")}
        </button>
      </div>

      {deleteConfirmation && (
        <div className="fixed inset-0 bg-[#111]/50 flex items-center justify-center z-[100] backdrop-blur-sm">
          <div className="bg-white rounded-[10px] shadow-lg w-[400px] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#D4E0F0] font-serif text-[18px] font-bold text-[#111] flex justify-between items-center">
              Delete File
              <button onClick={() => setDeleteConfirmation(null)} className="text-[#6b7a99] hover:text-[#111]">✕</button>
            </div>
            <div className="p-5">
              <p className="text-[14px] text-[#4a5568] mb-6">
                Are you sure you want to permanently delete <strong>{deleteConfirmation.fileName}</strong>? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setDeleteConfirmation(null)}
                  className="px-4 py-2 border border-[#D4E0F0] rounded-[6px] text-[#4a5568] text-[13px] font-bold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDeleteFile}
                  className="px-4 py-2 bg-red-600 text-white rounded-[6px] text-[13px] font-bold hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
