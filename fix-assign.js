const fs = require('fs');

let code = fs.readFileSync('src/actions/index.ts', 'utf8');

// Find bulkAssignToMandateAction and add isSentToClient: true
const targetCode = `        initials: c.initials || c.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase(),
        score: c.score || null,
        hasReport: !!c.score,
      });`;

const replacedCode = `        initials: c.initials || c.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase(),
        score: c.score || null,
        hasReport: !!c.score,
        isSentToClient: true, // Make visible by default
      });`;

code = code.replace(targetCode, replacedCode);

fs.writeFileSync('src/actions/index.ts', code);
console.log('Fixed assign action');
