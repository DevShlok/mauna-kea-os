const fs = require('fs');
let code = fs.readFileSync('src/features/candidates/components/CandidatesClient.tsx', 'utf8');

// 1. Update imports
code = code.replace(
  `import { mapCandidatesAction, processCandidatesAction } from "@/actions/candidates";`,
  `import { mapCandidatesAction, checkCandidateDuplicatesAction, finalizeCandidatesImportAction } from "@/actions/candidates";`
);

// 2. Add state variables inside component
const stateVarsInsert = `  // Duplicate Resolution States
  const [isResolvingDuplicates, setIsResolvingDuplicates] = useState(false);
  const [duplicateQueue, setDuplicateQueue] = useState<any[]>([]);
  const [currentDuplicateIndex, setCurrentDuplicateIndex] = useState(0);
  const [resolvedUpdates, setResolvedUpdates] = useState<any[]>([]);
  const [newCandidatesQueue, setNewCandidatesQueue] = useState<any[]>([]);
  const [fieldSelections, setFieldSelections] = useState<any>({});
`;

code = code.replace(
  `const [importHeaders, setImportHeaders] = useState<string[]>([]);`,
  `const [importHeaders, setImportHeaders] = useState<string[]>([]);\n${stateVarsInsert}`
);

// 3. Rewrite confirmImport
const newConfirmImport = `  const confirmImport = async () => {
    if (!importMapping || importFileData.length === 0) return;
    setIsImporting(true);
    try {
      const mappedCandidates = importFileData.map(row => {
        const cand: any = {};
        Object.keys(importMapping).forEach(dbKey => {
          const excelHeader = importMapping[dbKey];
          if (excelHeader && row[excelHeader] !== undefined) {
            cand[dbKey] = row[excelHeader];
          }
        });
        return cand;
      });

      const { duplicates, newCandidates } = await checkCandidateDuplicatesAction(mappedCandidates);

      if (duplicates && duplicates.length > 0) {
        setDuplicateQueue(duplicates);
        setNewCandidatesQueue(newCandidates || []);
        setCurrentDuplicateIndex(0);
        setResolvedUpdates([]);
        setIsResolvingDuplicates(true);
        // Pre-fill fieldSelections for first duplicate
        const initSelections: any = {};
        const first = duplicates[0].incomingCandidate;
        Object.keys(first).forEach(k => {
          if (first[k]) initSelections[k] = true;
        });
        setFieldSelections(initSelections);
      } else {
        // No duplicates, proceed directly
        const res = await finalizeCandidatesImportAction(newCandidates || [], []);
        if (!res.success) throw new Error("Failed to process import");
        toast.success("Successfully imported candidates!");
        setImportMapping(null);
        setImportFileData([]);
        router.refresh();
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
      toast.error("Error importing candidates.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleNextDuplicate = async (action: 'replace' | 'keep' | 'update' | 'new') => {
    const currentDuplicate = duplicateQueue[currentDuplicateIndex];
    const updatedList = [...resolvedUpdates];
    const newCandList = [...newCandidatesQueue];

    if (action === 'replace') {
      // Create a full update payload
      const fullUpdate: any = {};
      Object.keys(currentDuplicate.incomingCandidate).forEach(k => fullUpdate[k] = true);
      updatedList.push({
        incomingCandidate: currentDuplicate.incomingCandidate,
        existingId: currentDuplicate.existingCandidate.id,
        fieldsToUpdate: fullUpdate
      });
    } else if (action === 'update') {
      updatedList.push({
        incomingCandidate: currentDuplicate.incomingCandidate,
        existingId: currentDuplicate.existingCandidate.id,
        fieldsToUpdate: fieldSelections
      });
    } else if (action === 'new') {
      newCandList.push(currentDuplicate.incomingCandidate);
    }
    // if 'keep', do nothing (skip)

    setResolvedUpdates(updatedList);
    setNewCandidatesQueue(newCandList);

    if (currentDuplicateIndex < duplicateQueue.length - 1) {
      const nextIdx = currentDuplicateIndex + 1;
      setCurrentDuplicateIndex(nextIdx);
      const nextInc = duplicateQueue[nextIdx].incomingCandidate;
      const nextSelections: any = {};
      Object.keys(nextInc).forEach(k => {
        if (nextInc[k]) nextSelections[k] = true;
      });
      setFieldSelections(nextSelections);
    } else {
      // Done resolving
      setIsResolvingDuplicates(false);
      setIsImporting(true);
      try {
        const res = await finalizeCandidatesImportAction(newCandList, updatedList);
        if (!res.success) throw new Error("Failed to finalize import");
        toast.success("Successfully imported/updated candidates!");
        setImportMapping(null);
        setImportFileData([]);
        setDuplicateQueue([]);
        router.refresh();
        window.location.reload();
      } catch (err) {
        toast.error("Error finalizing import");
      } finally {
        setIsImporting(false);
      }
    }
  };
`;

const oldConfirmImportStart = `const confirmImport = async () => {`;
const startIdx = code.indexOf(oldConfirmImportStart);
const endIdx = code.indexOf(`const [companiesFilter`, startIdx);
code = code.substring(0, startIdx) + newConfirmImport + '\n  ' + code.substring(endIdx);

// 4. Add the DuplicateResolutionModal JSX right before the Import Mapping Modal
const duplicateModalJSX = `      {isResolvingDuplicates && duplicateQueue.length > 0 && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-gray-100 sticky top-0 bg-white z-10 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-[#133255]">Resolve Duplicate Profile</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Conflict {currentDuplicateIndex + 1} of {duplicateQueue.length}
                </p>
              </div>
              <div className="bg-yellow-50 text-yellow-800 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                <span>??</span>
                {duplicateQueue[currentDuplicateIndex]?.reason}
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-8">
                {/* Existing */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 border-b pb-2">Existing Profile</h3>
                  <div className="space-y-4">
                    {Object.keys(duplicateQueue[currentDuplicateIndex]?.incomingCandidate || {}).map(key => {
                      const val = duplicateQueue[currentDuplicateIndex]?.existingCandidate[key];
                      if (key === 'files') return null;
                      return (
                        <div key={key}>
                          <p className="text-xs text-gray-400 capitalize">{key}</p>
                          <p className="text-sm font-medium text-gray-900">{val || '-'}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Incoming */}
                <div className="bg-blue-50/50 rounded-xl p-5 border border-blue-100">
                  <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-4 border-b border-blue-100 pb-2">Incoming Data</h3>
                  <div className="space-y-4">
                    {Object.keys(duplicateQueue[currentDuplicateIndex]?.incomingCandidate || {}).map(key => {
                      const existingVal = duplicateQueue[currentDuplicateIndex]?.existingCandidate[key];
                      const incomingVal = duplicateQueue[currentDuplicateIndex]?.incomingCandidate[key];
                      if (key === 'files') return null;
                      
                      const isDifferent = incomingVal && String(existingVal) !== String(incomingVal);
                      
                      return (
                        <div key={key} className="flex items-start gap-3">
                          <input 
                            type="checkbox" 
                            checked={fieldSelections[key] || false}
                            onChange={(e) => setFieldSelections({...fieldSelections, [key]: e.target.checked})}
                            className="mt-1"
                            disabled={!incomingVal}
                          />
                          <div>
                            <p className="text-xs text-blue-400 capitalize">{key}</p>
                            <p className={\`text-sm font-medium \${isDifferent ? 'text-blue-700 bg-blue-100 px-1 rounded -ml-1' : 'text-gray-900'}\`}>
                              {incomingVal || '-'}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 sticky bottom-0 bg-white z-10 flex justify-between items-center bg-gray-50/50">
              <button 
                onClick={() => handleNextDuplicate('new')}
                className="text-sm font-medium text-gray-500 hover:text-gray-800 underline underline-offset-2"
              >
                Create as New (Ignore Match)
              </button>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => handleNextDuplicate('keep')}
                  className="px-5 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
                >
                  Keep Existing (Skip)
                </button>
                <button 
                  onClick={() => handleNextDuplicate('update')}
                  className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 transition-colors"
                >
                  Update Selected Fields
                </button>
                <button 
                  onClick={() => handleNextDuplicate('replace')}
                  className="px-5 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg shadow-sm hover:bg-red-700 transition-colors"
                >
                  Replace All Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}\n`;

code = code.replace(
  `{/* Import Modal */}`,
  duplicateModalJSX + `\n      {/* Import Modal */}`
);

fs.writeFileSync('src/features/candidates/components/CandidatesClient.tsx', code);
console.log('Done rewriting CandidatesClient.tsx');
