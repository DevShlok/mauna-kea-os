const fs = require('fs');

let code = fs.readFileSync('src/features/clients/components/ClientDetailClient.tsx', 'utf8');

const targetStr = `                <div>\r\n                  <label className="block text-xs font-bold text-gray-700 mb-1">Status</label>\r\n                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-[#133255]">\r\n                    <option value="Active">Active</option>\r\n                    <option value="Prospect">Prospect</option>\r\n                    <option value="Inactive">Inactive</option>\r\n                  </select>\r\n                </div>\r\n                \r\n                {/* Contacts Section */}`;
const replaceStr = `                <div>\n                  <label className="block text-xs font-bold text-gray-700 mb-1">Status</label>\n                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-[#133255]">\n                    <option value="Active">Active</option>\n                    <option value="Prospect">Prospect</option>\n                    <option value="Inactive">Inactive</option>\n                  </select>\n                </div>\n                </div>\n                \n                {/* Contacts Section */}`;

if (code.includes(targetStr)) {
    code = code.replace(targetStr, replaceStr);
} else {
    code = code.replace(targetStr.replace(/\r\n/g, '\n'), replaceStr);
}

fs.writeFileSync('src/features/clients/components/ClientDetailClient.tsx', code);
console.log('Fixed ClientDetailClient UI grid close tag');
