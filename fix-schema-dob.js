const fs = require('fs');

let schema = fs.readFileSync('src/db/schema.ts', 'utf8');
const searchStr = "createdAt: datetime('created_at').default(sql`now()`),";
const replaceStr = "dob: date('dob'),\n  hometown: varchar('hometown', { length: 100 }),\n  stability: json('stability').$type<{ current: string; previous: string }>(),\n  relocationStatus: varchar('relocation_status', { length: 50 }),\n  relocationPrefs: json('relocation_prefs').$type<string[]>(),\n  createdAt: datetime('created_at').default(sql`now()`),";

// Find the occurrence of searchStr that belongs to candidates.
// candidates is around line 60-100.
// Let's just do a specific replacement.
const candidatesBlockRegex = /export const candidates = pgTable\('candidates', \{[\s\S]*?\}\);/;
schema = schema.replace(candidatesBlockRegex, (match) => {
  return match.replace(searchStr, replaceStr);
});

fs.writeFileSync('src/db/schema.ts', schema);
console.log('Fixed schema.ts');
