"use client";
import { confirmDialog } from "@/components/ConfirmDialog";
import toast from "react-hot-toast";


import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createFrameworkAction, editFrameworkAction, deleteFrameworkAction } from "@/actions";

interface Criterion {
  name: string;
  weight: number;
}

interface Category {
  name: string;
  weight: number;
  criteria: Criterion[];
}

export default function CreateFrameworkClient({ mandates, initialData }: { mandates: any[], initialData?: any }) {
  const router = useRouter();
  const isEdit = !!initialData;
  const [name, setName] = useState(initialData?.name || "");
  const [industry, setIndustry] = useState(initialData?.industry || "");
  const [mandateIds, setMandateIds] = useState<string[]>(isEdit ? mandates.filter(m => m.frameworkId === initialData.id).map(m => m.id.toString()) : []);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [categories, setCategories] = useState<Category[]>(initialData?.categories && initialData.categories.length > 0 ? initialData.categories : [
    {
      name: "Financial Leadership",
      weight: 100,
      criteria: [
        { name: "P&L Management", weight: 40 },
        { name: "Financial Controls", weight: 60 }
      ]
    }
  ]);

  const handleAddCategory = () => {
    setCategories([...categories, { name: "New Category", weight: 0, criteria: [{ name: "New Criterion", weight: 100 }] }]);
  };

  const handleRemoveCategory = async (index: number) => {
    if (await confirmDialog("Remove this category?")) {
      const newCats = [...categories];
      newCats.splice(index, 1);
      setCategories(newCats);
    }
  };

  const handleCategoryNameChange = (index: number, newName: string) => {
    const newCats = [...categories];
    newCats[index].name = newName;
    setCategories(newCats);
  };

  const handleCategoryWeightChange = (index: number, newWeight: number) => {
    const newCats = [...categories];
    newCats[index].weight = newWeight;
    setCategories(newCats);
  };

  const handleAddCriterion = (catIndex: number) => {
    const newCats = [...categories];
    newCats[catIndex].criteria.push({ name: "", weight: 10 });
    setCategories(newCats);
  };

  const handleRemoveCriterion = (catIndex: number, critIndex: number) => {
    const newCats = [...categories];
    newCats[catIndex].criteria.splice(critIndex, 1);
    setCategories(newCats);
  };

  const handleCriterionChange = (catIndex: number, critIndex: number, field: keyof Criterion, value: string | number) => {
    const newCats = [...categories];
    if (field === 'weight') {
      newCats[catIndex].criteria[critIndex].weight = Number(value) || 0;
    } else {
      newCats[catIndex].criteria[critIndex].name = value as string;
    }
    setCategories(newCats);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !industry) return;
    
    // Validate category weights sum to 100
    const catSum = categories.reduce((a, b) => a + (b.weight || 0), 0);
    if (catSum !== 100) {
      toast.error(`Category weights sum to ${catSum}%. They must exactly sum to 100%.`);
      return;
    }

    // Validate criteria weights sum to 100
    for (let i = 0; i < categories.length; i++) {
      const sum = categories[i].criteria.reduce((a, b) => a + b.weight, 0);
      if (sum !== 100) {
        toast.error(`Category "${categories[i].name}" criteria weights sum to ${sum}%. They must exactly sum to 100%.`);
        return;
      }
    }
    
    const fw = {
      name,
      industry,
      categories
    };
    
    if (isEdit) {
      await editFrameworkAction(initialData.id, fw, mandateIds);
    } else {
      await createFrameworkAction(fw, mandateIds);
    }
    router.push("/dashboard/frameworks");
  };

  const handleDelete = async () => {
    if (await confirmDialog("Are you sure you want to permanently delete this framework?")) {
      setIsDeleting(true);
      await deleteFrameworkAction(initialData.id);
      router.push("/dashboard/frameworks");
      router.refresh();
    }
  };

  const inp = "w-full px-3 py-2 border border-gray-200 rounded text-sm outline-none focus:border-[#133255]";
  const section = "bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-6";
  const sectionHead = "bg-gray-50 border-b border-gray-200 px-5 py-3 font-bold text-xs uppercase tracking-wider text-[#133255]";

  return (
    <div className="max-w-3xl mx-auto pb-10">
      <div className="flex items-center gap-2 text-sm text-gray-400 font-semibold mb-6">
        <Link href="/dashboard/frameworks" className="hover:text-[#133255]">Frameworks</Link>
        <span>/</span>
        <span className="text-gray-800">{isEdit ? `Edit ${initialData.name}` : "Create New Framework"}</span>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">{isEdit ? `Edit Framework: ${initialData.name}` : "Create New Framework"}</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className={section}>
          <div className={sectionHead}>1 - Framework Details</div>
          <div className="p-5 grid grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Framework Name <span className="text-red-500">*</span></label>
              <input required value={name} onChange={(e) => setName(e.target.value)} type="text" className={inp} placeholder="e.g. Executive Assessment Framework"/>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Industry <span className="text-red-500">*</span></label>
              <input required value={industry} onChange={(e) => setIndustry(e.target.value)} type="text" className={inp} placeholder="e.g. Tech, Finance, Generic"/>
            </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Attach to Mandates (Optional)</label>
                <div className="border border-gray-200 rounded p-2 bg-white max-h-[150px] overflow-y-auto space-y-1">
                  {mandates.map(m => (
                    <label key={m.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1.5 rounded transition-colors">
                      <input 
                        type="checkbox" 
                        checked={mandateIds.includes(m.id.toString())}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setMandateIds([...mandateIds, m.id.toString()]);
                          } else {
                            setMandateIds(mandateIds.filter(id => id !== m.id.toString()));
                          }
                        }}
                        className="accent-[#133255] w-4 h-4"
                      />
                      <span className="text-gray-800 font-bold">{m.company}</span>
                      <span className="text-gray-500 text-xs border-l border-gray-300 pl-2 ml-1">{m.role}</span>
                    </label>
                  ))}
                  {mandates.length === 0 && <div className="text-gray-400 text-xs italic p-1">No mandates available</div>}
                </div>
              </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {categories.map((cat, cIdx) => {
            const sum = cat.criteria.reduce((a, b) => a + b.weight, 0);
            return (
              <div key={cIdx} className="bg-white border border-gray-200 rounded-[8px] overflow-hidden">
                <div className="bg-[#133255] text-white px-4 py-3 flex justify-between items-center">
                  <div className="flex items-center gap-4 w-1/2">
                    <input 
                      type="text" 
                      value={cat.name} 
                      onChange={(e) => handleCategoryNameChange(cIdx, e.target.value)}
                      className="bg-transparent border-b border-blue-400 text-white font-bold outline-none placeholder-blue-300 flex-1"
                      placeholder="Category Name"
                    />
                    <div className="flex items-center gap-1 shrink-0">
                      <input 
                        type="number" 
                        value={cat.weight === undefined ? 100 : cat.weight} 
                        onChange={(e) => handleCategoryWeightChange(cIdx, Number(e.target.value))}
                        className="bg-white/10 border-b border-blue-400 text-white font-bold outline-none w-16 text-center placeholder-blue-300 px-1"
                        placeholder="%"
                      />
                      <span className="text-blue-200 text-xs font-bold">% Weight</span>
                    </div>
                  </div>
                  <button type="button" onClick={() => handleRemoveCategory(cIdx)} className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded text-xs">
                    × Remove
                  </button>
                </div>
                <div className="p-4 bg-gray-50 flex flex-col gap-2">
                  {cat.criteria.map((cr, crIdx) => (
                    <div key={crIdx} className="flex gap-2 items-center bg-white p-2 border border-gray-200 rounded">
                      <span className="text-gray-400 cursor-move px-2">⠿</span>
                      <input 
                        type="text" 
                        value={cr.name} 
                        onChange={(e) => handleCriterionChange(cIdx, crIdx, 'name', e.target.value)}
                        className="flex-1 px-3 py-1.5 border border-gray-200 rounded text-sm outline-none focus:border-[#133255]"
                        placeholder="Criterion name"
                        required
                      />
                      <input 
                        type="number" 
                        value={cr.weight}
                        min={0}
                        max={100}
                        onChange={(e) => handleCriterionChange(cIdx, crIdx, 'weight', e.target.value)}
                        className="w-20 px-3 py-1.5 border border-gray-200 rounded text-sm outline-none focus:border-[#133255] text-center"
                        required
                      />
                      <span className="text-gray-500 font-bold">%</span>
                      <button type="button" onClick={() => handleRemoveCriterion(cIdx, crIdx)} className="text-red-500 hover:bg-red-50 w-8 h-8 rounded flex items-center justify-center font-bold text-lg">
                        ×
                      </button>
                    </div>
                  ))}
                  
                  {sum !== 100 && (
                    <div className="text-red-600 text-xs font-bold mt-2 bg-red-50 p-2 rounded flex items-center gap-2 border border-red-100">
                      <span>⚠</span> Weights sum to {sum}% (should be 100%)
                    </div>
                  )}

                  <button type="button" onClick={() => handleAddCriterion(cIdx)} className="mt-2 text-sm text-[#133255] font-bold hover:underline self-start">
                    + Add Criterion
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <button type="button" onClick={handleAddCategory} className="w-full py-3 border-2 border-dashed border-[#D8B15B] text-[#D8B15B] font-bold rounded hover:bg-[#fffdf8] bg-white transition-colors">
          + Add Category
        </button>

        <div className="flex justify-end gap-3 mt-4">
          {isEdit && (
            <button type="button" onClick={handleDelete} disabled={isDeleting} className="px-5 py-2.5 border border-red-200 text-red-600 bg-red-50 rounded text-sm font-bold hover:bg-red-100 mr-auto">
              {isDeleting ? "Deleting..." : "Delete Framework"}
            </button>
          )}
          <button type="button" onClick={() => router.push("/dashboard/frameworks")} className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded text-sm font-bold hover:bg-gray-50">
            Cancel
          </button>
          <button type="submit" className="px-6 py-2.5 bg-[#133255] text-white rounded text-sm font-bold hover:bg-[#133255] shadow-sm transition-colors">
            {isEdit ? "Update Framework" : "Save Framework"}
          </button>
        </div>
      </form>
    </div>
  );
}
