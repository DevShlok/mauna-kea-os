const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

function refactorConfirms() {
  let count = 0;
  walkDir('./src', (filePath) => {
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;

    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    const confirmRegex = /\bconfirm\(/g;
    
    if (confirmRegex.test(content)) {
      // Replace confirm( with await confirmDialog(
      content = content.replace(confirmRegex, 'await confirmDialog(');

      if (content !== original) {
        if (!content.includes('import { confirmDialog }')) {
          const importStatement = `import { confirmDialog } from "@/components/ConfirmDialog";\n`;
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
        console.log(`Refactored confirms in ${filePath}`);
      }
    }
  });
  console.log(`Finished refactoring confirms in ${count} files.`);
}

refactorConfirms();
