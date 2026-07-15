const fs = require('fs');

let code = fs.readFileSync('src/features/candidates/components/NewCandidateClient.tsx', 'utf8');

// 1. Add fields to initial state
const formStateRegex = /notes: initialData\?\.notes \|\| ""\n  \}\);/g;
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
const submitPayloadRegex = /const payload = \{\n      \.\.\.form,\n      qual: quals,/g;
const submitPayloadReplace = `const payload = {
      ...form,
      qual: quals,
      stability,
      relocationPrefs,`;
code = code.replace(submitPayloadRegex, submitPayloadReplace);

// 4. Inject JSX fields. Let's find a good spot, maybe under "Location" in the Professional Details section.
// Look for "Location" field block
const locationBlockRegex = /<div>\s*<label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Location<\/label>\s*<LocationTypeahead\s*value=\{form\.location\}\s*onChange=\{\(val\) => setForm\(\{\.\.\.form, location: val\}\)\}\s*\/>\s*<\/div>/g;

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

// 5. Add Stability fields. Let's place it near "Current CTC" or "Experience" block.
// Look for Experience field
const expBlockRegex = /<div>\s*<label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Total Exp \(Yrs\)</g;

const stabilityJSX = `<div>
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Total Exp (Yrs)`;

code = code.replace(expBlockRegex, stabilityJSX);

// Actually, let's inject stability right after Tenure
const tenureBlockRegex = /<div>\s*<label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Notice Period \(Days\)<\/label>\s*<input[^>]+>\s*<\/div>/g;

const newTenureJSX = `$&
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Current Company Tenure <span className="text-gray-400 lowercase font-normal">(Stability)</span></label>
                <input value={stability.current} onChange={e => setStability({...stability, current: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-md text-[15px] outline-none focus:border-[#133255]" placeholder="e.g. 5+ years" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Previous Company Tenure <span className="text-gray-400 lowercase font-normal">(Stability)</span></label>
                <input value={stability.previous} onChange={e => setStability({...stability, previous: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-md text-[15px] outline-none focus:border-[#133255]" placeholder="e.g. 4+ years" />
              </div>`;

code = code.replace(tenureBlockRegex, (match) => {
  return newTenureJSX.replace('$&', match);
});

fs.writeFileSync('src/features/candidates/components/NewCandidateClient.tsx', code);
console.log('Updated NewCandidateClient');
