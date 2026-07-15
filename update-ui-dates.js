const fs = require('fs');

let code = fs.readFileSync('src/features/candidates/components/CandidatesClient.tsx', 'utf8');

const oldHeader = `<h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 border-b pb-2">Existing Profile</h3>`;
const newHeader = `<h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2 border-b pb-2">Existing Profile</h3>
                  <div className="mb-4 text-xs space-y-1">
                    <p className="text-gray-400">Profile Updated: <span className="font-semibold text-gray-700">{duplicateQueue[currentDuplicateIndex]?.existingCandidate?.updatedAt ? new Date(duplicateQueue[currentDuplicateIndex].existingCandidate.updatedAt).toLocaleDateString('en-GB') : new Date(duplicateQueue[currentDuplicateIndex]?.existingCandidate?.createdAt || Date.now()).toLocaleDateString('en-GB')}</span></p>
                    {duplicateQueue[currentDuplicateIndex]?.existingCandidate?.files && duplicateQueue[currentDuplicateIndex].existingCandidate.files.length > 0 && (
                      <p className="text-gray-400">Latest Resume: <span className="font-semibold text-gray-700">{new Date(Math.max(...duplicateQueue[currentDuplicateIndex].existingCandidate.files.map((f: any) => new Date(f.createdAt || Date.now()).getTime()))).toLocaleDateString('en-GB')}</span></p>
                    )}
                  </div>`;
                  
code = code.replace(oldHeader, newHeader);

const oldIncomingHeader = `<h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-4 border-b border-blue-100 pb-2">Incoming Data</h3>`;
const newIncomingHeader = `<h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-2 border-b border-blue-100 pb-2">Incoming Data</h3>
                  <div className="mb-4 text-xs space-y-1">
                    <p className="text-blue-400">Import Date: <span className="font-semibold text-blue-700">{new Date().toLocaleDateString('en-GB')}</span></p>
                    {duplicateQueue[currentDuplicateIndex]?.incomingCandidate?.files && duplicateQueue[currentDuplicateIndex].incomingCandidate.files.length > 0 && (
                      <p className="text-blue-400">Includes New Resume: <span className="font-semibold text-blue-700">Yes</span></p>
                    )}
                  </div>`;

code = code.replace(oldIncomingHeader, newIncomingHeader);

fs.writeFileSync('src/features/candidates/components/CandidatesClient.tsx', code);
console.log('Updated UI Dates');
