const fs = require('fs');

let code = fs.readFileSync('src/features/candidates/components/NewCandidateClient.tsx', 'utf8');

const targetBlock1 = `              <div>\r\n                <label className="block text-[14px] font-bold tracking-wide uppercase text-[#6b7a99] mb-1.5">Tenure in current company (yrs)</label>\r\n                <input type="number" value={form.tenure} onChange={e=>setForm({...form, tenure:e.target.value})} className="w-full h-[42px] border-[1.5px] border-[#D4E0F0] rounded-md px-3 text-[16px] outline-none bg-white focus:border-[#133255]" min="0" step="0.1" />\r\n              </div>`;
const targetBlock2 = `              <div>\n                <label className="block text-[14px] font-bold tracking-wide uppercase text-[#6b7a99] mb-1.5">Tenure in current company (yrs)</label>\n                <input type="number" value={form.tenure} onChange={e=>setForm({...form, tenure:e.target.value})} className="w-full h-[42px] border-[1.5px] border-[#D4E0F0] rounded-md px-3 text-[16px] outline-none bg-white focus:border-[#133255]" min="0" step="0.1" />\n              </div>`;

if (code.includes(targetBlock1)) {
    code = code.replace(targetBlock1, '');
    console.log("Removed old tenure block (CRLF)");
} else if (code.includes(targetBlock2)) {
    code = code.replace(targetBlock2, '');
    console.log("Removed old tenure block (LF)");
} else {
    // try to find it by index
    let idx = code.indexOf('Tenure in current company (yrs)');
    if (idx !== -1) {
        let divStart = code.lastIndexOf('<div>', idx);
        let divEnd = code.indexOf('</div>', idx) + 6;
        if (divStart !== -1 && divEnd !== -1) {
            code = code.substring(0, divStart) + code.substring(divEnd);
            console.log("Removed old tenure block via index");
        }
    } else {
        console.log("Could not find old tenure block");
    }
}

fs.writeFileSync('src/features/candidates/components/NewCandidateClient.tsx', code);
