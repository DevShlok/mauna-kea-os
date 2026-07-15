const fs = require('fs');
let code = fs.readFileSync('src/features/candidates/components/FlCandidateClient.tsx', 'utf8');
console.log("Length:", code.length);
console.log("Contains calculateAge:", code.includes('calculateAge'));
console.log("Index of calculateAge:", code.indexOf('calculateAge'));
if (code.indexOf('calculateAge') !== -1) {
    console.log("Surrounding text:", code.substring(code.indexOf('calculateAge') - 20, code.indexOf('calculateAge') + 50));
}
