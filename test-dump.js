const fs = require('fs');
let code = fs.readFileSync('src/features/candidates/components/FlCandidateClient.tsx', 'utf8');
console.log(code.substring(12400, 13400));
