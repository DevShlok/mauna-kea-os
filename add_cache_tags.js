const fs = require('fs');
const path = 'src/app/actions.ts';
let content = fs.readFileSync(path, 'utf8');

// Ensure revalidatePath is imported
if (!content.includes('import { revalidatePath')) {
  content = content.replace(/'use server';\n/, "'use server';\nimport { revalidatePath } from 'next/cache';\n");
}

// Find all export async function declarations
content = content.replace(/export async function (\w+)\(([^)]*)\) \{/g, 'export async function $1($2) {\n  revalidatePath("/dashboard", "layout");');

fs.writeFileSync(path, content, 'utf8');
console.log('Done!');
