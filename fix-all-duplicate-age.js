const fs = require('fs');

let code = fs.readFileSync('src/features/candidates/components/NewCandidateClient.tsx', 'utf8');

// The pattern to match calculateAge function definition
const ageHelperRegex = /\s*const calculateAge = \(dobString: string\) => \{[\s\S]*?return age;\s*\};\r?\n/g;

// Remove all occurrences
code = code.replace(ageHelperRegex, '');

// Insert exactly one occurrence right before "const getInitialFiles = () =>"
const insertPoint = 'const getInitialFiles = () =>';
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
  };\n\n  `;

if (code.includes(insertPoint)) {
    code = code.replace(insertPoint, ageHelperBlock + insertPoint);
    fs.writeFileSync('src/features/candidates/components/NewCandidateClient.tsx', code);
    console.log("Successfully replaced calculateAge with exactly one occurrence.");
} else {
    console.log("Could not find insert point.");
}

