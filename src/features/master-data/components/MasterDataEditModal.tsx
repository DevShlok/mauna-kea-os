"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import { 
  createMasterClientAction, updateMasterClientAction, 
  createMasterIndustryAction, updateMasterIndustryAction, 
  createMasterLocationAction, updateMasterLocationAction 
} from "@/actions/masterData";

export default function MasterDataEditModal({
  isOpen, onClose, type, initialData
}: {
  isOpen: boolean;
  onClose: () => void;
  type: "clients" | "industries" | "locations";
  initialData: any | null; // null means create mode
}) {
  const isEdit = !!initialData;
  const [formData, setFormData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData(initialData || {});
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (type === "clients") {
        if (isEdit) await updateMasterClientAction(formData.id, formData);
        else await createMasterClientAction(formData);
      } else if (type === "industries") {
        if (isEdit) await updateMasterIndustryAction(formData.id, formData);
        else await createMasterIndustryAction(formData);
      } else if (type === "locations") {
        if (isEdit) await updateMasterLocationAction(formData.id, formData);
        else await createMasterLocationAction(formData);
      }
      toast.success(isEdit ? "Updated successfully!" : "Created successfully!");
      onClose();
    } catch (e: any) {
      toast.error(e.message || "Failed to save.");
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass = "w-full h-10 px-3 border border-gray-300 rounded-md focus:border-[#133255] focus:ring-1 focus:ring-[#133255] outline-none";

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-bold text-[#133255]">{isEdit ? "Edit" : "Create"} {type === "clients" ? "Client" : type === "industries" ? "Industry" : "Location"}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {type === "clients" && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Company Name *</label>
                <input name="companyName" value={formData.companyName || ""} onChange={handleChange} className={inputClass} required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Industry</label>
                <input name="industry" value={formData.industry || ""} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">HR Leader Name</label>
                <input name="hrLeaderName" value={formData.hrLeaderName || ""} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
                <input name="phone" value={formData.phone || ""} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Account Owner</label>
                <input name="accountOwner" value={formData.accountOwner || ""} onChange={handleChange} className={inputClass} />
              </div>
            </>
          )}

          {type === "industries" && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Sector Name *</label>
                <input name="sectorName" value={formData.sectorName || ""} onChange={handleChange} className={inputClass} required />
              </div>
            </>
          )}

          {type === "locations" && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Standardized Location *</label>
                <input name="standardizedLocation" value={formData.standardizedLocation || ""} onChange={handleChange} className={inputClass} required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Raw Entry (Alias) *</label>
                <input name="rawEntry" value={formData.rawEntry || ""} onChange={handleChange} className={inputClass} required />
              </div>
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-200 rounded-md transition-colors">
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className="px-6 py-2 bg-[#D8B15B] text-[#133255] font-bold rounded-md hover:bg-[#e8c97a] disabled:opacity-50 transition-colors"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
