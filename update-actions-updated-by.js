const fs = require('fs');

let code = fs.readFileSync('src/actions/candidates.ts', 'utf8');

// Ensure imports for Supabase auth and platformUsers
if (!code.includes('createClient')) {
  code = code.replace(
    'import { db } from "@/db";',
    'import { db } from "@/db";\nimport { createClient } from "@/utils/supabase/server";\nimport { platformUsers } from "@/db/schema";'
  );
}

// Add getCurrentUserName helper if it doesn't exist
if (!code.includes('async function getCurrentUserName')) {
  const helper = `\nasync function getCurrentUserName(): Promise<string> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      const dbUser = await db.select().from(platformUsers).where(eq(platformUsers.email, user.email));
      if (dbUser.length > 0) return dbUser[0].name;
      return user.email;
    }
  } catch(e) {}
  return "Unknown";
}\n`;

  code = code.replace(
    'export async function checkCandidateDuplicatesAction',
    helper + '\nexport async function checkCandidateDuplicatesAction'
  );
}

// Update finalizeCandidatesImportAction
if (!code.includes('const updatedBy = await getCurrentUserName();')) {
  code = code.replace(
    'export async function finalizeCandidatesImportAction(newCandidates: any[], updatedCandidates: any[]) {',
    'export async function finalizeCandidatesImportAction(newCandidates: any[], updatedCandidates: any[]) {\n  const updatedBy = await getCurrentUserName();'
  );
}

const updatePayloadRegex = /updatePayload\.updatedAt = new Date\(\);/g;
code = code.replace(updatePayloadRegex, `updatePayload.updatedAt = new Date();\n    updatePayload.updatedBy = updatedBy;`);

fs.writeFileSync('src/actions/candidates.ts', code);
console.log('Updated candidates action with updatedBy');
