const fs = require('fs');

function fixNewCandidateClient() {
  let code = fs.readFileSync('src/features/candidates/components/NewCandidateClient.tsx', 'utf8');

  if (code.includes('stability: initialData?.stability')) return; // Already patched

  // 1. Add fields to initial state
  const formStateRegex = /notes:\s*initialData\?\.notes\s*\|\|\s*""\r?\n\s*\}\);/;
  const formStateReplace = `notes: initialData?.notes || "",
    dob: initialData?.dob ? new Date(initialData.dob).toISOString().split('T')[0] : "",
    hometown: initialData?.hometown || "",
    relocationStatus: initialData?.relocationStatus || "Open to relocation",
  });
  
  const [stability, setStability] = useState<{ current: string; previous: string }>(
    initialData?.stability || { current: "", previous: "" }
  );
  const [relocationPrefs, setRelocationPrefs] = useState<string[]>(initialData?.relocationPrefs || []);`;
  
  code = code.replace(formStateRegex, formStateReplace);

  // 2. Add Age calculation helper
  const helperInsertPos = code.indexOf('const getInitialFiles = () =>');
  const ageHelper = `  const calculateAge = (dobString: string) => {
    if (!dobString) return null;
    const today = new Date();
    const birthDate = new Date(dobString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };\n\n`;
  code = code.substring(0, helperInsertPos) + ageHelper + code.substring(helperInsertPos);

  // 3. Update the submit payload
  const submitPayloadRegex = /const payload = \{\r?\n\s*\.\.\.form,\r?\n\s*qual: quals,/;
  const submitPayloadReplace = `const payload = {
      ...form,
      qual: quals,
      stability,
      relocationPrefs,`;
  code = code.replace(submitPayloadRegex, submitPayloadReplace);

  // 4. Inject JSX fields under Location
  const locationBlockRegex = /<div>\s*<label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Location<\/label>\s*<LocationTypeahead\s*value=\{form\.location\}\s*onChange=\{\(val\) => setForm\(\{\.\.\.form, location: val\}\)\}\s*\/>\s*<\/div>/;

  const newFieldsJSX = `<div>
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Location</label>
                <LocationTypeahead value={form.location} onChange={(val) => setForm({...form, location: val})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Hometown</label>
                <input value={form.hometown} onChange={e => setForm({...form, hometown: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-md text-[15px] outline-none focus:border-[#133255]" placeholder="e.g. Bangalore" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Date of Birth {form.dob && <span className="text-[#133255] bg-blue-50 px-2 py-0.5 rounded-full lowercase ml-2">(Age: {calculateAge(form.dob)} years)</span>}</label>
                <input type="date" value={form.dob} onChange={e => setForm({...form, dob: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-md text-[15px] outline-none focus:border-[#133255]" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Relocation Preference</label>
                <select value={form.relocationStatus} onChange={e => setForm({...form, relocationStatus: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-md text-[15px] outline-none focus:border-[#133255]">
                  <option value="Open to relocation">Open to relocation</option>
                  <option value="Not open">Not open</option>
                  <option value="Depends on opportunity">Depends on opportunity</option>
                </select>
              </div>
              {form.relocationStatus !== "Not open" && (
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Preferred Locations <span className="text-gray-400 lowercase font-normal">(Comma separated)</span></label>
                  <input 
                    value={relocationPrefs.join(', ')} 
                    onChange={e => setRelocationPrefs(e.target.value.split(',').map(s => s.trim()).filter(Boolean))} 
                    className="w-full px-4 py-3 border border-gray-200 rounded-md text-[15px] outline-none focus:border-[#133255]" 
                    placeholder="e.g. Delhi NCR, Mumbai, Pune" 
                  />
                </div>
              )}`;

  code = code.replace(locationBlockRegex, newFieldsJSX);

  // 5. Add Stability fields near Notice Period
  const tenureBlockRegex = /<div>\s*<label className="block text-\[14px\] font-bold tracking-wide uppercase text-\[#6b7a99\] mb-1\.5">Notice Period \(days\)<\/label>\s*<input[^>]+>\s*<\/div>/;

  const newTenureJSX = `$&
              <div>
                <label className="block text-[14px] font-bold tracking-wide uppercase text-[#6b7a99] mb-1.5">Current Company Tenure <span className="text-gray-400 lowercase font-normal">(Stability)</span></label>
                <input value={stability.current} onChange={e => setStability({...stability, current: e.target.value})} className="w-full h-[42px] border-[1.5px] border-[#D4E0F0] rounded-md px-3 text-[16px] outline-none bg-white focus:border-[#133255]" placeholder="e.g. 5+ years" />
              </div>
              <div>
                <label className="block text-[14px] font-bold tracking-wide uppercase text-[#6b7a99] mb-1.5">Previous Company Tenure <span className="text-gray-400 lowercase font-normal">(Stability)</span></label>
                <input value={stability.previous} onChange={e => setStability({...stability, previous: e.target.value})} className="w-full h-[42px] border-[1.5px] border-[#D4E0F0] rounded-md px-3 text-[16px] outline-none bg-white focus:border-[#133255]" placeholder="e.g. 4+ years" />
              </div>`;

  code = code.replace(tenureBlockRegex, (match) => newTenureJSX.replace('$&', match));

  fs.writeFileSync('src/features/candidates/components/NewCandidateClient.tsx', code);
  console.log('Fixed NewCandidateClient.tsx');
}

function fixFlCandidateClient() {
  let code = fs.readFileSync('src/features/candidates/components/FlCandidateClient.tsx', 'utf8');

  if (code.includes('calculateAge(candidate.dob)')) return;

  // 1. Age Calculation helper
  const helperInsertPos = code.indexOf('const statusClass = candidate.status');
  const ageHelper = `  const calculateAge = (dobString: string) => {
    if (!dobString) return null;
    const today = new Date();
    const birthDate = new Date(dobString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };\n\n`;
  code = code.substring(0, helperInsertPos) + ageHelper + code.substring(helperInsertPos);

  // 2. Inject profile details under Notice period
  const noticeRegex = /<span className="text-\[14px\] text-\[#6b7a99\]">Notice: \{candidate\.notice\} days<\/span>/;
  const newProfileTags = `$&
            {candidate.dob && <span className="text-[14px] text-[#6b7a99]">Age: {calculateAge(candidate.dob)} yrs</span>}
            {candidate.hometown && <span className="text-[14px] text-[#6b7a99]">Hometown: {candidate.hometown}</span>}`;
            
  code = code.replace(noticeRegex, (match) => newProfileTags.replace('$&', match));

  // 3. Inject Stability and Relocation in the main details block
  const topBlockEndRegex = /<\/div>\s*<\/div>\s*\{candidate\.hasCv &&/;

  const stabilityRelocJSX = `</div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Stability Box */}
        {(candidate.stability?.current || candidate.stability?.previous) && (
          <div className="bg-white border border-[#D4E0F0] rounded-[10px] p-5 shadow-sm">
            <h3 className="text-[13px] font-bold tracking-wide uppercase text-[#6b7a99] mb-3 border-b border-gray-100 pb-2">Employment Stability</h3>
            <div className="space-y-3">
              {candidate.stability?.current && (
                <div className="flex justify-between items-center">
                  <span className="text-[14px] text-gray-500">Current Company</span>
                  <span className="text-[15px] font-semibold text-gray-900">{candidate.stability.current}</span>
                </div>
              )}
              {candidate.stability?.previous && (
                <div className="flex justify-between items-center">
                  <span className="text-[14px] text-gray-500">Previous Company</span>
                  <span className="text-[15px] font-semibold text-gray-900">{candidate.stability.previous}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Relocation Box */}
        {candidate.relocationStatus && (
          <div className="bg-white border border-[#D4E0F0] rounded-[10px] p-5 shadow-sm">
            <h3 className="text-[13px] font-bold tracking-wide uppercase text-[#6b7a99] mb-3 border-b border-gray-100 pb-2">Relocation Preferences</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[14px] text-gray-500">Status</span>
                <span className="text-[14px] font-semibold bg-gray-100 px-2 py-1 rounded text-gray-800">{candidate.relocationStatus}</span>
              </div>
              {candidate.relocationPrefs && candidate.relocationPrefs.length > 0 && (
                <div>
                  <span className="text-[14px] text-gray-500 block mb-2">Preferred Locations</span>
                  <div className="flex flex-wrap gap-2">
                    {candidate.relocationPrefs.map((loc: string, i: number) => (
                      <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 text-[13px] font-medium rounded-md border border-blue-100">
                        {loc}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {candidate.hasCv &&`;

  code = code.replace(topBlockEndRegex, stabilityRelocJSX);

  fs.writeFileSync('src/features/candidates/components/FlCandidateClient.tsx', code);
  console.log('Fixed FlCandidateClient.tsx');
}

fixNewCandidateClient();
fixFlCandidateClient();
