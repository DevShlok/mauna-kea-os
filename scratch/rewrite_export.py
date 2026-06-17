import re

filepath = r"c:\Users\LENOVO\OneDrive\Desktop\Mauna Kea OS\mauna-kea-os\src\app\dashboard\candidates\CandidatesClient.tsx"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Insert exportToExcel function after `const allSelected = ...`
export_logic = """
  const exportToExcel = () => {
    import('xlsx').then(XLSX => {
      const dataToExport = filtered.map(c => {
        const qualsStr = c.qual && Array.isArray(c.qual) 
          ? c.qual.map((q: any) => typeof q === 'string' ? q : `${q.degree || ''} ${q.institute ? `from ${q.institute}` : ''} ${q.year ? `(${q.year})` : ''}`).join('; ')
          : '';

        return {
          "Candidate ID": c.id,
          "Name": c.name,
          "Email": c.email || '',
          "Mobile": c.mobile || '',
          "Location": c.location || '',
          "Current Company": c.company || '',
          "Current Designation": c.designation || '',
          "Total Experience (Years)": c.exp ?? '',
          "Tenure in Current Org (Years)": c.tenure ?? '',
          "CTC (Lakhs)": c.ctc ?? '',
          "Fixed CTC (Lakhs)": c.fixedCtc ?? '',
          "Variable CTC (Lakhs)": c.variableCtc ?? '',
          "Expected CTC (Lakhs)": c.expected ?? '',
          "Notice Period (Days)": c.notice ?? '',
          "Status": c.status || '',
          "Qualifications": qualsStr,
          "Prior Employers / Exp Tags": (c.expTags || []).join(', '),
          "Dream Roles": (c.dreamRoles || []).join(', '),
          "Dream Companies": (c.dreamCos || []).join(', '),
          "LinkedIn Profile URL": c.linkedin || '',
          "Target Company": c.targetCompany || '',
          "Notes": c.notes || '',
          "Resume/CV (Drive Link)": c.cvFileName?.startsWith('http') ? c.cvFileName : (c.cvFileName ? 'Yes' : ''),
          "LinkedIn PDF (Drive Link)": c.linkedinPdf?.startsWith('http') ? c.linkedinPdf : (c.linkedinPdf ? 'Yes' : '')
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Candidates");
      XLSX.writeFile(workbook, "Candidates_Export.xlsx");
    });
  };
"""

content = content.replace("const allSelected = filtered.length > 0 && selectedIds.size === filtered.length;", "const allSelected = filtered.length > 0 && selectedIds.size === filtered.length;\n" + export_logic)

# 2. Replace the Add Candidate button
old_button = """        <Link href="/dashboard/candidates/new" className="px-5 py-2.5 bg-[#D8B15B] text-[#0d2f6e] rounded-lg text-sm font-bold shadow-sm hover:bg-[#e8c97a] transition-colors inline-block">
          + Add Candidate
        </Link>"""

new_buttons = """        <div className="flex gap-3">
          <button onClick={exportToExcel} className="px-5 py-2.5 bg-white border border-[#e4e8f0] text-[#4a5568] rounded-lg text-sm font-bold shadow-sm hover:bg-[#f8fafc] transition-colors inline-flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Export
          </button>
          <Link href="/dashboard/candidates/new" className="px-5 py-2.5 bg-[#D8B15B] text-[#0d2f6e] rounded-lg text-sm font-bold shadow-sm hover:bg-[#e8c97a] transition-colors inline-block">
            + Add Candidate
          </Link>
        </div>"""

content = content.replace(old_button, new_buttons)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
