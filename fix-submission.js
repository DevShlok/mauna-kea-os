const fs = require('fs');

let code = fs.readFileSync('src/actions/index.ts', 'utf8');

const targetCode2 = `        initials: data.candName.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase(),
      });`;

const replacedCode2 = `        initials: data.candName.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase(),
        isSentToClient: true,
      });`;

code = code.replace(targetCode2, replacedCode2);

fs.writeFileSync('src/actions/index.ts', code);
console.log('Fixed submission action');
