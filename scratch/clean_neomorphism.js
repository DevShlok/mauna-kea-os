const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/features/candidate-portal/components/CandidateProfileView.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove background: "#e0e5ec" and boxShadow from style props in inputs and selects
content = content.replace(/className="([^"]*)"\s*style=\{\{\s*background:\s*"#e0e5ec",\s*boxShadow:\s*[\s\S]*?\}\}/g, (match, p1) => {
  return `className="${p1} neo-inset"`;
});

// 2. Fix Edit Profile button
content = content.replace(/className="flex items-center gap-2 px-4 py-2\.5 rounded-xl text-\[13px\] font-bold transition-all hover:-translate-y-0\.5"\s*style=\{\{\s*background:\s*"#e0e5ec",[\s\S]*?\}\}/g, 'className="neo-btn flex items-center gap-2 px-4 py-2.5 text-[13px] font-bold text-[#133255]"');

// 3. Fix Download CV button
content = content.replace(/className="flex items-center gap-2 px-4 py-2\.5 rounded-xl text-\[13px\] font-bold text-white transition-all hover:-translate-y-0\.5"\s*style=\{\{\s*background:\s*"linear-gradient[^"]*",[\s\S]*?\}\}/g, 'className="neo-btn-primary flex items-center gap-2 px-4 py-2.5 text-[13px] font-bold"');

// 4. Fix icon containers in summary cards
content = content.replace(/className="w-12 h-12 rounded-2xl flex items-center justify-center text-\[#133255\] shrink-0"\s*style=\{\{\s*background:\s*"#e0e5ec",[\s\S]*?\}\}/g, 'className="w-12 h-12 neo-inset flex items-center justify-center text-[#133255] shrink-0"');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated CandidateProfileView.tsx neorphism classes');
