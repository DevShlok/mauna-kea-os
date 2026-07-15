const fs = require('fs');
let code = fs.readFileSync('src/features/candidates/components/NewCandidateClient.tsx', 'utf8');

const target = `        notes: form.notes,\r\n        profilePic: profilePicBase64\r\n      };`;
const replace = `        notes: form.notes,\r\n        profilePic: profilePicBase64,\r\n        dob: form.dob,\r\n        hometown: form.hometown,\r\n        stability,\r\n        relocationStatus: form.relocationStatus,\r\n        relocationPrefs\r\n      };`;

if (code.includes(target)) {
  code = code.replace(target, replace);
  console.log("Replaced payload with \\r");
} else {
  const target2 = `        notes: form.notes,\n        profilePic: profilePicBase64\n      };`;
  const replace2 = `        notes: form.notes,\n        profilePic: profilePicBase64,\n        dob: form.dob,\n        hometown: form.hometown,\n        stability,\n        relocationStatus: form.relocationStatus,\n        relocationPrefs\n      };`;
  if (code.includes(target2)) {
    code = code.replace(target2, replace2);
    console.log("Replaced payload (no \\r)");
  } else {
    // try index of
    let idx = code.indexOf('notes: form.notes,');
    if (idx !== -1) {
      let endIdx = code.indexOf('};', idx) + 2;
      let existingPayload = code.substring(idx, endIdx);
      let newPayload = existingPayload.replace('};', ',\n        dob: form.dob,\n        hometown: form.hometown,\n        stability,\n        relocationStatus: form.relocationStatus,\n        relocationPrefs\n      };');
      code = code.substring(0, idx) + newPayload + code.substring(endIdx);
      console.log("Replaced payload using indexOf fallback");
    }
  }
}

fs.writeFileSync('src/features/candidates/components/NewCandidateClient.tsx', code);
