const fs = require('fs');

let code = fs.readFileSync('src/features/candidates/components/NewCandidateClient.tsx', 'utf8');

const ageHelperBlock = `  const calculateAge = (dobString: string) => {
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

const ageHelperBlockCRLF = ageHelperBlock.replace(/\n/g, '\r\n');

// Find all occurrences
let firstIdx = code.indexOf('const calculateAge =');
if (firstIdx !== -1) {
    let secondIdx = code.indexOf('const calculateAge =', firstIdx + 10);
    if (secondIdx !== -1) {
        // It's duplicated. Replace the first one with nothing.
        let endIdx = code.indexOf('};\n', firstIdx) + 3;
        if (code.substring(firstIdx, endIdx).includes('return age;')) {
           code = code.substring(0, firstIdx) + code.substring(endIdx);
           
           // If there is still a \n\n left over, it's fine.
           fs.writeFileSync('src/features/candidates/components/NewCandidateClient.tsx', code);
           console.log("Removed duplicate calculateAge");
        } else {
           // Try CRLF
           endIdx = code.indexOf('};\r\n', firstIdx) + 4;
           code = code.substring(0, firstIdx) + code.substring(endIdx);
           fs.writeFileSync('src/features/candidates/components/NewCandidateClient.tsx', code);
           console.log("Removed duplicate calculateAge (CRLF)");
        }
    } else {
        console.log("Only one calculateAge found?!");
    }
}
