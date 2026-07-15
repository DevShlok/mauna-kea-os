const fs = require('fs');

function fixJSX(filepath) {
  let code = fs.readFileSync(filepath, 'utf8');
  code = code.replace(/>Client \*<</g, '>Client *<');
  code = code.replace(/>Client<</g, '>Client<');
  fs.writeFileSync(filepath, code);
  console.log('Fixed ' + filepath);
}

fixJSX('src/features/clients/components/NewClientClient.tsx');
fixJSX('src/features/clients/components/ClientDetailClient.tsx');
