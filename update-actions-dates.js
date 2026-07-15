const fs = require('fs');

let code = fs.readFileSync('src/actions/candidates.ts', 'utf8');

// Ensure we select candidateFiles
if (!code.includes('import { candidateFiles }')) {
  // It's probably already imported since it was in the original file
}

// 1. Update existingCandidates query to include files (or we fetch them on the fly)
const existingQuery = `const existingCandidates = await db.select().from(candidates).where(eq(candidates.isDeleted, false));`;
const newExistingQuery = `const existingCandidates = await db.select().from(candidates).where(eq(candidates.isDeleted, false));
  const existingFiles = await db.select().from(candidateFiles);
  
  // Attach files to candidates for date checking
  existingCandidates.forEach((c: any) => {
    c.files = existingFiles.filter(f => f.candId === c.id);
  });`;
  
code = code.replace(existingQuery, newExistingQuery);

// 2. Update finalizeCandidatesImportAction to set updatedAt on update
const updatePayloadRegex = /if \(Object\.keys\(updatePayload\)\.length > 0\) {/g;
code = code.replace(updatePayloadRegex, `updatePayload.updatedAt = new Date();
    if (Object.keys(updatePayload).length > 0) {`);

fs.writeFileSync('src/actions/candidates.ts', code);
console.log('Updated actions');
