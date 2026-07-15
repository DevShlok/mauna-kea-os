const fs = require('fs');

function replaceInFile(filepath) {
  if (!fs.existsSync(filepath)) return;
  let code = fs.readFileSync(filepath, 'utf8');

  // Replace exact header and label strings
  code = code.replace(/>Company name</g, '>Client<');
  code = code.replace(/>Company Name</g, '>Client<');
  code = code.replace(/>Company</g, '>Client<'); // Be careful, but table header is uppercase Company Name probably
  code = code.replace(/>Vertical</g, '>Industry<');
  code = code.replace(/No Vertical/g, 'No Industry');
  code = code.replace(/>Owner</g, '>Account owner<');
  code = code.replace(/No Owner/g, 'No Account owner');
  
  // Specific to filter in ClientsClient
  code = code.replace(/"All verticals"/g, '"All industries"');
  code = code.replace(/"All Verticals"/g, '"All industries"');
  code = code.replace(/>All Verticals</g, '>All industries<');
  code = code.replace(/>All verticals</g, '>All industries<');

  fs.writeFileSync(filepath, code);
  console.log('Updated ' + filepath);
}

replaceInFile('src/features/clients/components/ClientsClient.tsx');
replaceInFile('src/features/clients/components/ClientDetailClient.tsx');
replaceInFile('src/features/clients/components/NewClientClient.tsx');
