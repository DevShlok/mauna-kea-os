const fs = require('fs');

let code = fs.readFileSync('src/db/schema.ts', 'utf8');

const target = `  status: varchar('status', { length: 50 }).default('Active'),
  isDeleted: boolean('is_deleted').default(false),`;

const replace = `  status: varchar('status', { length: 50 }).default('Active'),
  legalEntityName: varchar('legal_entity_name', { length: 255 }),
  contacts: json('contacts').$type<{name: string; designation: string; number: string; email: string}[]>().default([]),
  isDeleted: boolean('is_deleted').default(false),`;

if (code.includes('legalEntityName')) {
    console.log("Schema already updated");
} else {
    // Try to replace, taking \r\n into account
    let success = false;
    if (code.includes(target)) {
        code = code.replace(target, replace);
        success = true;
    } else {
        const target2 = target.replace(/\n/g, '\r\n');
        if (code.includes(target2)) {
            code = code.replace(target2, replace.replace(/\n/g, '\r\n'));
            success = true;
        } else {
            // substring replace
            let idx = code.indexOf("isDeleted: boolean('is_deleted').default(false),");
            if (idx !== -1) {
                const replaceStr = `  legalEntityName: varchar('legal_entity_name', { length: 255 }),\n  contacts: json('contacts').$type<{name: string; designation: string; number: string; email: string}[]>().default([]),\n`;
                code = code.substring(0, idx) + replaceStr + code.substring(idx);
                success = true;
            }
        }
    }
    
    if (success) {
        fs.writeFileSync('src/db/schema.ts', code);
        console.log("Updated schema.ts");
    } else {
        console.log("Failed to find insertion point");
    }
}
