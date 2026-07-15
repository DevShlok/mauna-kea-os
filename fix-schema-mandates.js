const fs = require('fs');

let schema = fs.readFileSync('src/db/schema.ts', 'utf8');

const regexToRemove = /\s+dob: date\('dob'\),\n\s+hometown: varchar\('hometown', \{ length: 100 \}\),\n\s+stability: json\('stability'\)\.\$type<\{ current: string; previous: string \}>\(\),\n\s+relocationStatus: varchar\('relocation_status', \{ length: 50 \}\),\n\s+relocationPrefs: json\('relocation_prefs'\)\.\$type<string\[\]>\(\),/;

// We only want to remove the FIRST occurrence (in mandates). 
schema = schema.replace(regexToRemove, "");

fs.writeFileSync('src/db/schema.ts', schema);
console.log('Fixed schema mandates table');
