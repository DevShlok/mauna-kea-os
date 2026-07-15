const fs = require('fs');

let code = fs.readFileSync('src/features/candidates/components/CandidatesClient.tsx', 'utf8');

const oldHeaderStr = `<p className="text-gray-400">Profile Updated: <span className="font-semibold text-gray-700">{duplicateQueue[currentDuplicateIndex]?.existingCandidate?.updatedAt ? new Date(duplicateQueue[currentDuplicateIndex].existingCandidate.updatedAt).toLocaleDateString('en-GB') : new Date(duplicateQueue[currentDuplicateIndex]?.existingCandidate?.createdAt || Date.now()).toLocaleDateString('en-GB')}</span></p>`;

const newHeaderStr = `<p className="text-gray-400">Profile Updated: <span className="font-semibold text-gray-700">{duplicateQueue[currentDuplicateIndex]?.existingCandidate?.updatedAt ? new Date(duplicateQueue[currentDuplicateIndex].existingCandidate.updatedAt).toLocaleDateString('en-GB') : new Date(duplicateQueue[currentDuplicateIndex]?.existingCandidate?.createdAt || Date.now()).toLocaleDateString('en-GB')}</span></p>
                    {duplicateQueue[currentDuplicateIndex]?.existingCandidate?.updatedBy && (
                      <p className="text-gray-400">Updated By: <span className="font-semibold text-gray-700">{duplicateQueue[currentDuplicateIndex].existingCandidate.updatedBy}</span></p>
                    )}`;

code = code.replace(oldHeaderStr, newHeaderStr);

fs.writeFileSync('src/features/candidates/components/CandidatesClient.tsx', code);
console.log('Updated UI with Updated By');
