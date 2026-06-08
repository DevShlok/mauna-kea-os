"use client";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useState } from "react";
import { DATA } from "@/db/mockData";

export default function FrameworkEditorPage() {
  const { id } = useParams();
  const router = useRouter();
  const isNew = id === "new";
  const original = DATA.frameworks.find((f) => f.id === id);
  const [fw, setFw] = useState(isNew
    ? { name: "", industry: "", categories: [] as {name:string,criteria:{name:string,weight:number}[]}[] }
    : original ? { ...original, categories: original.categories.map(c=>({...c,criteria:[...c.criteria]})) }
    : { name: "", industry: "", categories: [] as {name:string,criteria:{name:string,weight:number}[]}[] }
  );

  const addCategory = () => setFw({ ...fw, categories: [...fw.categories, { name: "New Category", criteria: [{ name: "", weight: 100 }] }] });
  const removeCategory = (ci: number) => setFw({ ...fw, categories: fw.categories.filter((_, i) => i !== ci) });
  const addCriterion = (ci: number) => {
    const cats = [...fw.categories];
    cats[ci] = { ...cats[ci], criteria: [...cats[ci].criteria, { name: "", weight: 10 }] };
    setFw({ ...fw, categories: cats });
  };
  const removeCriterion = (ci: number, cri: number) => {
    const cats = [...fw.categories];
    cats[ci] = { ...cats[ci], criteria: cats[ci].criteria.filter((_, i) => i !== cri) };
    setFw({ ...fw, categories: cats });
  };
  const updateCritWeight = (ci: number, cri: number, val: number) => {
    const cats = [...fw.categories];
    cats[ci].criteria[cri].weight = val;
    setFw({ ...fw, categories: cats });
  };
  const updateCritName = (ci: number, cri: number, val: string) => {
    const cats = [...fw.categories];
    cats[ci].criteria[cri].name = val;
    setFw({ ...fw, categories: cats });
  };

  return (
    <div className="max-w-3xl mx-auto pb-10">
      <div className="flex items-center gap-2 text-sm text-gray-400 font-semibold mb-6">
        <Link href="/dashboard/frameworks" className="hover:text-blue-900">Frameworks</Link>
        <span>/</span>
        <span className="text-gray-800">{isNew ? "New Framework" : fw.name}</span>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm mb-5">
        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">Framework Name</label>
            <input value={fw.name} onChange={(e) => setFw({...fw, name: e.target.value})} type="text" className="w-full px-3 py-2 border border-gray-200 rounded text-sm outline-none focus:border-blue-900" placeholder="Framework name"/>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">Industry / Sector</label>
            <input value={fw.industry} onChange={(e) => setFw({...fw, industry: e.target.value})} type="text" className="w-full px-3 py-2 border border-gray-200 rounded text-sm outline-none focus:border-blue-900" placeholder="e.g. BFSI, Technology"/>
          </div>
        </div>
      </div>

      {fw.categories.map((cat, ci) => {
        const totalWeight = cat.criteria.reduce((s, c) => s + (c.weight || 0), 0);
        return (
          <div key={ci} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-4">
            <div className="bg-blue-900 px-5 py-3 flex justify-between items-center">
              <input value={cat.name} onChange={(e) => { const cats=[...fw.categories]; cats[ci]={...cats[ci],name:e.target.value}; setFw({...fw,categories:cats}); }} className="bg-transparent text-white font-bold text-sm outline-none placeholder-blue-300 flex-1" placeholder="Category name"/>
              <button onClick={() => removeCategory(ci)} className="text-blue-200 hover:text-white text-xs font-bold">x Remove</button>
            </div>
            <div className="p-4">
              <div className="flex gap-2 text-xs font-bold text-gray-400 uppercase mb-2 px-1">
                <div className="flex-1">Criterion</div>
                <div className="w-20 text-center">Weight %</div>
                <div className="w-8"/>
              </div>
              {cat.criteria.map((cr, cri) => (
                <div key={cri} className="flex items-center gap-2 mb-2">
                  <input value={cr.name} onChange={(e) => updateCritName(ci, cri, e.target.value)} className="flex-1 px-3 py-1.5 border border-gray-200 rounded text-sm outline-none focus:border-blue-900" placeholder="Criterion name"/>
                  <input type="number" value={cr.weight} min={0} max={100} onChange={(e) => updateCritWeight(ci, cri, parseInt(e.target.value)||0)} className="w-20 px-2 py-1.5 border border-gray-200 rounded text-sm text-center outline-none focus:border-blue-900"/>
                  <button onClick={() => removeCriterion(ci, cri)} className="text-red-400 hover:text-red-600 font-bold text-lg w-8 text-center">x</button>
                </div>
              ))}
              {totalWeight !== 100 && (
                <div className="text-orange-500 text-xs font-bold mt-1 mb-2">Warning: Weights sum to {totalWeight}% (should be 100%)</div>
              )}
              <button onClick={() => addCriterion(ci)} className="text-blue-900 text-xs font-bold hover:underline mt-1">+ Add Criterion</button>
            </div>
          </div>
        );
      })}

      <button onClick={addCategory} className="w-full py-3 bg-yellow-500 text-blue-900 rounded-xl text-sm font-bold hover:bg-yellow-400 mb-6">+ Add Category</button>
      <div className="flex justify-end gap-3">
        <button onClick={() => router.push("/dashboard/frameworks")} className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded text-sm font-bold hover:bg-gray-50">Cancel</button>
        <button onClick={() => { alert("Framework saved!"); router.push("/dashboard/frameworks"); }} className="px-5 py-2.5 bg-blue-900 text-white rounded text-sm font-bold hover:bg-blue-800">Save Framework</button>
      </div>
    </div>
  );
}