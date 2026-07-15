const fs = require('fs');

let code = fs.readFileSync('src/db/schema.ts', 'utf8');

const target = `  relocationPrefs: json('relocation_prefs').$type<string[]>(),\r\n  createdAt: datetime('created_at').default(sql\`now()\`),`;
const replace = `  relocationPrefs: json('relocation_prefs').$type<string[]>(),\r\n  createdAt: datetime('created_at').default(sql\`now()\`),\r\n  updatedAt: datetime('updated_at').default(sql\`now()\`),\r\n  updatedBy: varchar('updated_by', { length: 255 }),`;

if (code.includes(target)) {
    code = code.replace(target, replace);
    fs.writeFileSync('src/db/schema.ts', code);
    console.log("Restored updatedAt to candidates (CRLF)");
} else {
    const target2 = target.replace(/\r\n/g, '\n');
    if (code.includes(target2)) {
        code = code.replace(target2, replace.replace(/\r\n/g, '\n'));
        fs.writeFileSync('src/db/schema.ts', code);
        console.log("Restored updatedAt to candidates (LF)");
    } else {
        console.log("Could not find target in candidates");
    }
}
