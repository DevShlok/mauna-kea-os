const fs = require('fs');
let schema = fs.readFileSync('src/db/schema.ts', 'utf8');

// Find and remove updatedAt and updatedBy from mandates
const mandatesBlockRegex = /export const mandates = pgTable\('mandates', \{[\s\S]*?\}\);/;
schema = schema.replace(mandatesBlockRegex, (match) => {
  return match.replace(/\s*updatedAt: datetime\('updated_at'\)\.default\(sql`now\(\)`\),\s*updatedBy: varchar\('updated_by', \{ length: 255 \}\),/g, '');
});

fs.writeFileSync('src/db/schema.ts', schema);
console.log('Fixed mandates schema');
