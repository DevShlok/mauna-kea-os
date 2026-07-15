const fs = require('fs');
let code = fs.readFileSync('src/actions/index.ts', 'utf8');

// Update createClientAction
const createTarget = `    status: data.status || "Active",`;
const createReplace = `    status: data.status || "Active",\n    legalEntityName: data.legalEntityName || null,\n    contacts: data.contacts || [],`;

if (code.includes(createTarget)) {
    code = code.replace(createTarget, createReplace);
} else {
    code = code.replace(createTarget.replace(/\n/g, '\r\n'), createReplace.replace(/\n/g, '\r\n'));
}

// Update updateClientAction
const updateTarget = `    owner: data.owner,\n    status: data.status || "Active",\n  }).where(eq(clients.id, id));`;
const updateTargetCRLF = `    owner: data.owner,\r\n    status: data.status || "Active",\r\n  }).where(eq(clients.id, id));`;
const updateReplace = `    owner: data.owner,\n    status: data.status || "Active",\n    legalEntityName: data.legalEntityName || null,\n    contacts: data.contacts || [],\n  }).where(eq(clients.id, id));`;

if (code.includes(updateTarget)) {
    code = code.replace(updateTarget, updateReplace);
} else if (code.includes(updateTargetCRLF)) {
    code = code.replace(updateTargetCRLF, updateReplace.replace(/\n/g, '\r\n'));
} else {
    // try to find it dynamically
    let idx = code.indexOf('export async function updateClientAction');
    if (idx !== -1) {
        let setEndIdx = code.indexOf('}).where(eq(clients.id, id));', idx);
        if (setEndIdx !== -1) {
            code = code.substring(0, setEndIdx) + `  legalEntityName: data.legalEntityName || null,\n    contacts: data.contacts || [],\n  ` + code.substring(setEndIdx);
        }
    }
}

fs.writeFileSync('src/actions/index.ts', code);
console.log("Patched actions");
