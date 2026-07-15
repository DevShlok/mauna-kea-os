const fs = require('fs');
let code = fs.readFileSync('src/actions/index.ts', 'utf8');

// Update addFloatListEntryAction
let addRegex = /esopVesting: data.esopVesting \|\| null,\n  }\);/g;
code = code.replace(addRegex, `esopVesting: data.esopVesting || null,
    dob: data.dob || null,
    hometown: data.hometown || null,
    stability: data.stability || null,
    relocationStatus: data.relocationStatus || null,
    relocationPrefs: data.relocationPrefs || null,
  });`);

// Update editFloatListEntryAction
let editRegex = /esops: data.esops \? Number\(data.esops\) : null,\n    esopVesting: data.esopVesting \|\| null,\n  }\)/g;
code = code.replace(editRegex, `esops: data.esops ? Number(data.esops) : null,
    esopVesting: data.esopVesting || null,
    dob: data.dob || null,
    hometown: data.hometown || null,
    stability: data.stability || null,
    relocationStatus: data.relocationStatus || null,
    relocationPrefs: data.relocationPrefs || null,
  })`);

fs.writeFileSync('src/actions/index.ts', code);
console.log('Updated candidate actions');
