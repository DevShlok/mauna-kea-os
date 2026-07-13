const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

function refactorAlerts() {
  let count = 0;
  walkDir('./src', (filePath) => {
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;

    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    const alertRegex = /alert\((.*?)\)/g;
    
    if (alertRegex.test(content)) {
      content = content.replace(alertRegex, (match, p1) => {
        if (p1.toLowerCase().includes('success')) {
          return `toast.success(${p1})`;
        }
        return `toast.error(${p1})`;
      });

      if (content !== original) {
        if (!content.includes('import toast from')) {
          const importStatement = `import toast from "react-hot-toast";\n`;
          if (content.startsWith('"use client"')) {
            content = content.replace(/^"use client"([;\n]*)/, `"use client";\n${importStatement}`);
          } else if (content.startsWith('import')) {
            content = content.replace(/^(import.*?\n)/, `$1${importStatement}`);
          } else {
            content = importStatement + content;
          }
        }
        fs.writeFileSync(filePath, content, 'utf8');
        count++;
        console.log(`Refactored alerts in ${filePath}`);
      }
    }
  });
  console.log(`Finished refactoring alerts in ${count} files.`);
}

refactorAlerts();
