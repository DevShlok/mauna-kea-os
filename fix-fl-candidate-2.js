const fs = require('fs');
let code = fs.readFileSync('src/features/candidates/components/FlCandidateClient.tsx', 'utf8');

console.log("Read file");
if (code.includes('calculateAge')) {
  console.log("Already has calculateAge");
} else {
  console.log("Does not have calculateAge");
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
  console.log("Inserted ageHelper");

  const noticeRegex = /<span className="text-\[14px\] text-\[#6b7a99\]">Notice: \{candidate\.notice\} days<\/span>/;
  const newProfileTags = `$&
            {candidate.dob && <span className="text-[14px] text-[#6b7a99]">Age: {calculateAge(candidate.dob)} yrs</span>}
            {candidate.hometown && <span className="text-[14px] text-[#6b7a99]">Hometown: {candidate.hometown}</span>}`;
            
  code = code.replace(noticeRegex, (match) => newProfileTags.replace('$&', match));
  console.log("Replaced notice regex");

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
  console.log("Replaced top block");

  fs.writeFileSync('src/features/candidates/components/FlCandidateClient.tsx', code);
  console.log('Fixed FlCandidateClient.tsx');
}
