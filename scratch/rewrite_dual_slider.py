import os

filepath = r"c:\Users\LENOVO\OneDrive\Desktop\Mauna Kea OS\mauna-kea-os\src\app\dashboard\candidates\CandidatesClient.tsx"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

slider_code = """
const DualRangeSlider = ({ min, max, step, value, onChange }: any) => {
  const minVal = value.min === '' ? min : Number(value.min);
  const maxVal = value.max === '' ? max : Number(value.max);

  const handleMinChange = (e: any) => {
    const v = Math.min(Number(e.target.value), maxVal);
    onChange({ ...value, min: v.toString() });
  };

  const handleMaxChange = (e: any) => {
    const v = Math.max(Number(e.target.value), minVal);
    onChange({ ...value, max: v.toString() });
  };

  const minPercent = ((minVal - min) / (max - min)) * 100;
  const maxPercent = ((maxVal - min) / (max - min)) * 100;

  return (
    <div className="relative w-full h-[5px] bg-[#e4e8f0] rounded-full mt-4 mb-2">
      <div 
        className="absolute h-full bg-[#1d4ed8] rounded-full" 
        style={{ left: `${minPercent}%`, width: `${maxPercent - minPercent}%` }} 
      />
      <input 
        type="range" 
        min={min} 
        max={max} 
        step={step} 
        value={minVal} 
        onChange={handleMinChange}
        className="absolute w-full h-[5px] opacity-0 cursor-pointer pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto"
        style={{ zIndex: minVal > max - (max-min)*0.1 ? 5 : 3 }}
      />
      <input 
        type="range" 
        min={min} 
        max={max} 
        step={step} 
        value={maxVal} 
        onChange={handleMaxChange}
        className="absolute w-full h-[5px] opacity-0 cursor-pointer pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto"
        style={{ zIndex: 4 }}
      />
      <div className="absolute top-1/2 -translate-y-1/2 w-[14px] h-[14px] bg-white border-[2.5px] border-[#1d4ed8] rounded-full pointer-events-none shadow-sm" style={{ left: `calc(${minPercent}% - 7px)` }} />
      <div className="absolute top-1/2 -translate-y-1/2 w-[14px] h-[14px] bg-white border-[2.5px] border-[#1d4ed8] rounded-full pointer-events-none shadow-sm" style={{ left: `calc(${maxPercent}% - 7px)` }} />
    </div>
  );
};
"""

# Inject slider code after MultiSelect component
parts = content.split('export default function CandidatesClient')
content = parts[0] + slider_code + '\nexport default function CandidatesClient' + parts[1]

# Replace UI section
old_ui = """
            <div>
              <label className="block text-[11px] font-bold tracking-wider uppercase text-[#8a93a3] mb-1.5">Total exp (yrs)</label>
              <div className="flex items-center gap-2">
                <input type="number" placeholder="Min" value={expRange.min} onChange={e => setExpRange({...expRange, min: e.target.value})} className="w-1/2 h-[42px] border-[1.5px] border-[#e4e8f0] rounded-[10px] px-3 text-[13px] outline-none focus:border-[#1d4ed8] bg-white"/>
                <input type="number" placeholder="Max" value={expRange.max} onChange={e => setExpRange({...expRange, max: e.target.value})} className="w-1/2 h-[42px] border-[1.5px] border-[#e4e8f0] rounded-[10px] px-3 text-[13px] outline-none focus:border-[#1d4ed8] bg-white"/>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold tracking-wider uppercase text-[#8a93a3] mb-1.5">Tenure, current org (yrs)</label>
              <div className="flex items-center gap-2">
                <input type="number" placeholder="Min" value={tenureRange.min} onChange={e => setTenureRange({...tenureRange, min: e.target.value})} className="w-1/2 h-[42px] border-[1.5px] border-[#e4e8f0] rounded-[10px] px-3 text-[13px] outline-none focus:border-[#1d4ed8] bg-white" step="0.1"/>
                <input type="number" placeholder="Max" value={tenureRange.max} onChange={e => setTenureRange({...tenureRange, max: e.target.value})} className="w-1/2 h-[42px] border-[1.5px] border-[#e4e8f0] rounded-[10px] px-3 text-[13px] outline-none focus:border-[#1d4ed8] bg-white" step="0.1"/>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold tracking-wider uppercase text-[#8a93a3] mb-1.5">CTC (₹ Cr)</label>
              <div className="flex items-center gap-2">
                <input type="number" placeholder="Min" value={ctcRange.min} onChange={e => setCtcRange({...ctcRange, min: e.target.value})} className="w-1/2 h-[42px] border-[1.5px] border-[#e4e8f0] rounded-[10px] px-3 text-[13px] outline-none focus:border-[#1d4ed8] bg-white" step="0.01"/>
                <input type="number" placeholder="Max" value={ctcRange.max} onChange={e => setCtcRange({...ctcRange, max: e.target.value})} className="w-1/2 h-[42px] border-[1.5px] border-[#e4e8f0] rounded-[10px] px-3 text-[13px] outline-none focus:border-[#1d4ed8] bg-white" step="0.01"/>
              </div>
            </div>
"""

new_ui = """
            <div>
              <label className="block text-[11px] font-bold tracking-wider uppercase text-[#8a93a3] mb-1.5">Experience (yrs)</label>
              <div className="flex items-center gap-2 mb-2">
                <input type="number" placeholder="Min" value={expRange.min} onChange={e => {
                  let val = e.target.value;
                  if(expRange.max && Number(val) > Number(expRange.max)) val = expRange.max;
                  setExpRange({...expRange, min: val});
                }} className="w-1/2 h-[38px] border-[1.5px] border-[#e4e8f0] rounded-[10px] px-3 text-[13px] outline-none focus:border-[#1d4ed8] bg-white"/>
                <input type="number" placeholder="Max" value={expRange.max} onChange={e => {
                  let val = e.target.value;
                  if(expRange.min && val !== '' && Number(val) < Number(expRange.min)) val = expRange.min;
                  setExpRange({...expRange, max: val});
                }} className="w-1/2 h-[38px] border-[1.5px] border-[#e4e8f0] rounded-[10px] px-3 text-[13px] outline-none focus:border-[#1d4ed8] bg-white"/>
              </div>
              <DualRangeSlider min={0} max={40} step={1} value={expRange} onChange={setExpRange} />
            </div>
            <div>
              <label className="block text-[11px] font-bold tracking-wider uppercase text-[#8a93a3] mb-1.5">Tenure, current org (yrs)</label>
              <div className="flex items-center gap-2 mb-2">
                <input type="number" placeholder="Min" value={tenureRange.min} onChange={e => {
                  let val = e.target.value;
                  if(tenureRange.max && Number(val) > Number(tenureRange.max)) val = tenureRange.max;
                  setTenureRange({...tenureRange, min: val});
                }} className="w-1/2 h-[38px] border-[1.5px] border-[#e4e8f0] rounded-[10px] px-3 text-[13px] outline-none focus:border-[#1d4ed8] bg-white" step="0.1"/>
                <input type="number" placeholder="Max" value={tenureRange.max} onChange={e => {
                  let val = e.target.value;
                  if(tenureRange.min && val !== '' && Number(val) < Number(tenureRange.min)) val = tenureRange.min;
                  setTenureRange({...tenureRange, max: val});
                }} className="w-1/2 h-[38px] border-[1.5px] border-[#e4e8f0] rounded-[10px] px-3 text-[13px] outline-none focus:border-[#1d4ed8] bg-white" step="0.1"/>
              </div>
              <DualRangeSlider min={0} max={25} step={0.5} value={tenureRange} onChange={setTenureRange} />
            </div>
            <div>
              <label className="block text-[11px] font-bold tracking-wider uppercase text-[#8a93a3] mb-1.5">CTC (₹ Cr)</label>
              <div className="flex items-center gap-2 mb-2">
                <input type="number" placeholder="Min" value={ctcRange.min} onChange={e => {
                  let val = e.target.value;
                  if(ctcRange.max && Number(val) > Number(ctcRange.max)) val = ctcRange.max;
                  setCtcRange({...ctcRange, min: val});
                }} className="w-1/2 h-[38px] border-[1.5px] border-[#e4e8f0] rounded-[10px] px-3 text-[13px] outline-none focus:border-[#1d4ed8] bg-white" step="0.01"/>
                <input type="number" placeholder="Max" value={ctcRange.max} onChange={e => {
                  let val = e.target.value;
                  if(ctcRange.min && val !== '' && Number(val) < Number(ctcRange.min)) val = ctcRange.min;
                  setCtcRange({...ctcRange, max: val});
                }} className="w-1/2 h-[38px] border-[1.5px] border-[#e4e8f0] rounded-[10px] px-3 text-[13px] outline-none focus:border-[#1d4ed8] bg-white" step="0.01"/>
              </div>
              <DualRangeSlider min={0} max={10} step={0.05} value={ctcRange} onChange={setCtcRange} />
            </div>
"""

content = content.replace(old_ui.strip(), new_ui.strip())

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Added dual range sliders successfully")
