const fs = require('fs');

function replaceInFile(filepath) {
  if (!fs.existsSync(filepath)) return;
  let code = fs.readFileSync(filepath, 'utf8');

  code = code.replace(/>Company Name \*/g, '>Client *<');
  code = code.replace(/>Company Name/g, '>Client<');

  fs.writeFileSync(filepath, code);
  console.log('Updated ' + filepath);
}

replaceInFile('src/features/clients/components/ClientDetailClient.tsx');
replaceInFile('src/features/clients/components/NewClientClient.tsx');
