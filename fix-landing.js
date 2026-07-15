const fs = require("fs");
let content = fs.readFileSync("src/app/page.tsx", "utf8");

// The strings to extract
const formRowStr = `
  const FormRow = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
    <div className="group flex rounded-xl overflow-hidden border border-gray-200/80 bg-white/60 backdrop-blur-md shadow-sm hover:shadow-md hover:border-gray-300/80 transition-all duration-300">
      <div className="w-[140px] sm:w-[160px] flex-shrink-0 flex items-center px-4 py-3 bg-gray-50/80 border-r border-gray-200/60">
        <span className="text-[12px] sm:text-[13px] text-gray-700 font-semibold tracking-tight">{label}{required && <span className="text-red-400 ml-0.5">*</span>}</span>
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );

  const inputCls = "w-full bg-transparent px-4 py-3 text-[13px] text-gray-800 outline-none placeholder:text-gray-400/70 placeholder:font-light";
`;

// Replace it with empty
content = content.replace(formRowStr, "");

// Add it to the top before export default
const replacementStr = `const FormRow = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <div className="group flex rounded-xl overflow-hidden border border-gray-200/80 bg-white/60 backdrop-blur-md shadow-sm hover:shadow-md hover:border-gray-300/80 transition-all duration-300">
    <div className="w-[140px] sm:w-[160px] flex-shrink-0 flex items-center px-4 py-3 bg-gray-50/80 border-r border-gray-200/60">
      <span className="text-[12px] sm:text-[13px] text-gray-700 font-semibold tracking-tight">{label}{required && <span className="text-red-400 ml-0.5">*</span>}</span>
    </div>
    <div className="flex-1 min-w-0">{children}</div>
  </div>
);

const inputCls = "w-full bg-transparent px-4 py-3 text-[13px] text-gray-800 outline-none placeholder:text-gray-400/70 placeholder:font-light";

export default function LandingPage() {`;

content = content.replace("export default function LandingPage() {", replacementStr);

fs.writeFileSync("src/app/page.tsx", content);
console.log("Fixed LandingPage");
