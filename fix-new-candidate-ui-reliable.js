const fs = require('fs');

let code = fs.readFileSync('src/features/candidates/components/NewCandidateClient.tsx', 'utf8');

// 1. Initial State
const stateTarget = `    notes: initialData?.notes || ""\r\n  });`;
if (code.includes(stateTarget)) {
  const stateReplace = `    notes: initialData?.notes || "",
    dob: initialData?.dob ? new Date(initialData.dob).toISOString().split('T')[0] : "",
    hometown: initialData?.hometown || "",
    relocationStatus: initialData?.relocationStatus || "Open to relocation",
  });
  
  const [stability, setStability] = useState<{ current: string; previous: string }>(
    initialData?.stability || { current: "", previous: "" }
  );
  const [relocationPrefs, setRelocationPrefs] = useState<string[]>(initialData?.relocationPrefs || []);`;
  code = code.replace(stateTarget, stateReplace);
  console.log("Replaced initial state");
} else {
  // Let's try without \r
  const stateTarget2 = `    notes: initialData?.notes || ""\n  });`;
  if (code.includes(stateTarget2)) {
    // Replace stateTarget2
    const stateReplace = `    notes: initialData?.notes || "",
    dob: initialData?.dob ? new Date(initialData.dob).toISOString().split('T')[0] : "",
    hometown: initialData?.hometown || "",
    relocationStatus: initialData?.relocationStatus || "Open to relocation",
  });
  
  const [stability, setStability] = useState<{ current: string; previous: string }>(
    initialData?.stability || { current: "", previous: "" }
  );
  const [relocationPrefs, setRelocationPrefs] = useState<string[]>(initialData?.relocationPrefs || []);`;
    code = code.replace(stateTarget2, stateReplace);
    console.log("Replaced initial state (no \\r)");
  } else {
    console.log("Could not find initial state target block!");
  }
}

// 2. Age helper
if (!code.includes('calculateAge(dobString')) {
  const helperTarget = `const getInitialFiles = () =>`;
  if (code.includes(helperTarget)) {
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
    code = code.replace(helperTarget, ageHelper + helperTarget);
    console.log("Inserted age helper");
  } else {
    console.log("Could not find age helper insertion point");
  }
}

// 3. Submit Payload
const payloadTarget = `    const payload = {\r\n      ...form,\r\n      qual: quals,`;
if (code.includes(payloadTarget)) {
  code = code.replace(payloadTarget, `    const payload = {\n      ...form,\n      qual: quals,\n      stability,\n      relocationPrefs,`);
  console.log("Replaced payload");
} else {
  const payloadTarget2 = `    const payload = {\n      ...form,\n      qual: quals,`;
  if (code.includes(payloadTarget2)) {
    code = code.replace(payloadTarget2, `    const payload = {\n      ...form,\n      qual: quals,\n      stability,\n      relocationPrefs,`);
    console.log("Replaced payload (no \\r)");
  } else {
    console.log("Could not find payload target!");
  }
}

// 4. Location block
const locTarget = `              <div>\r\n                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Location</label>\r\n                <LocationTypeahead value={form.location} onChange={(val) => setForm({...form, location: val})} />\r\n              </div>`;
if (code.includes(locTarget) && !code.includes('Date of Birth')) {
  const newFieldsJSX = `              <div>
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
  code = code.replace(locTarget, newFieldsJSX);
  console.log("Replaced location block");
} else {
  // Let's try without \r
  const locTarget2 = `              <div>\n                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Location</label>\n                <LocationTypeahead value={form.location} onChange={(val) => setForm({...form, location: val})} />\n              </div>`;
  if (code.includes(locTarget2) && !code.includes('Date of Birth')) {
    // Replace here ... (skipping copy-paste for brevity, just replacing on original match)
    // Actually I can just replace the string by removing \r
    code = code.replace(locTarget2, locTarget2.replace('Location</label>\n', 'Location</label>\n') + '\n              <div><label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Date of Birth</label>... etc'); // Just use regex replace carefully
  }
}

// If literal match failed, use robust substring search
if (!code.includes('Date of Birth')) {
  let idx = code.indexOf('onChange={(val) => setForm({...form, location: val})} />');
  if (idx !== -1) {
    let divEnd = code.indexOf('</div>', idx) + 6;
    
    const newFieldsJSX = `
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
    code = code.substring(0, divEnd) + newFieldsJSX + code.substring(divEnd);
    console.log("Inserted Location block using substring");
  }
}

// 5. Tenure Block
if (!code.includes('Current Company Tenure')) {
  let idx = code.indexOf('Notice Period (days)');
  if (idx !== -1) {
    let divEnd = code.indexOf('</div>', idx) + 6;
    
    const newTenureJSX = `
              <div>
                <label className="block text-[14px] font-bold tracking-wide uppercase text-[#6b7a99] mb-1.5">Current Company Tenure <span className="text-gray-400 lowercase font-normal">(Stability)</span></label>
                <input value={stability.current} onChange={e => setStability({...stability, current: e.target.value})} className="w-full h-[42px] border-[1.5px] border-[#D4E0F0] rounded-md px-3 text-[16px] outline-none bg-white focus:border-[#133255]" placeholder="e.g. 5+ years" />
              </div>
              <div>
                <label className="block text-[14px] font-bold tracking-wide uppercase text-[#6b7a99] mb-1.5">Previous Company Tenure <span className="text-gray-400 lowercase font-normal">(Stability)</span></label>
                <input value={stability.previous} onChange={e => setStability({...stability, previous: e.target.value})} className="w-full h-[42px] border-[1.5px] border-[#D4E0F0] rounded-md px-3 text-[16px] outline-none bg-white focus:border-[#133255]" placeholder="e.g. 4+ years" />
              </div>`;
              
    code = code.substring(0, divEnd) + newTenureJSX + code.substring(divEnd);
    console.log("Inserted Tenure block using substring");
  }
}

fs.writeFileSync('src/features/candidates/components/NewCandidateClient.tsx', code);
console.log('Saved NewCandidateClient.tsx');
