const fs = require('fs');

let code = fs.readFileSync('src/actions/index.ts', 'utf8');

// Undo the incorrect insertion in addFloatListEntryAction
const wrongTarget = `    status: data.status || "Active",\r\n    legalEntityName: data.legalEntityName || null,\r\n    contacts: data.contacts || [],`;
const wrongTargetLF = `    status: data.status || "Active",\n    legalEntityName: data.legalEntityName || null,\n    contacts: data.contacts || [],`;

if (code.includes(wrongTarget)) {
    code = code.replace(wrongTarget, `    status: data.status || "Active",`);
} else if (code.includes(wrongTargetLF)) {
    code = code.replace(wrongTargetLF, `    status: data.status || "Active",`);
}

// Ensure createClientAction HAS the new fields
const createClientRegex = /export async function createClientAction[\s\S]*?status: data\.status \|\| "Active",\r?\n\s*\}/;
if (code.match(createClientRegex)) {
    code = code.replace(createClientRegex, (match) => {
        if (!match.includes('legalEntityName')) {
            return match.replace(/status: data\.status \|\| "Active",\r?\n\s*\}/, 'status: data.status || "Active",\n    legalEntityName: data.legalEntityName || null,\n    contacts: data.contacts || [],\n  }');
        }
        return match;
    });
} else {
    // try to find it by index
    let idx = code.indexOf('export async function createClientAction');
    if (idx !== -1) {
        let blockEnd = code.indexOf('}', idx);
        let statusIdx = code.lastIndexOf('status: data.status || "Active",', blockEnd);
        if (statusIdx !== -1) {
            code = code.substring(0, statusIdx) + 'status: data.status || "Active",\n    legalEntityName: data.legalEntityName || null,\n    contacts: data.contacts || [],\n  ' + code.substring(blockEnd);
        }
    }
}

fs.writeFileSync('src/actions/index.ts', code);
console.log("Fixed actions again");
