"use client";

import { useState } from "react";
import { MasterClient, MasterIndustry, MasterLocation } from "@/db/schema";
import { Upload, Database, Building2, MapPin, Briefcase, Plus, Edit2, Trash2 } from "lucide-react";
import MasterDataImportModal from "./MasterDataImportModal";
import MasterDataEditModal from "./MasterDataEditModal";
import toast from "react-hot-toast";
import { deleteMasterClientAction, deleteMasterIndustryAction, deleteMasterLocationAction } from "@/actions/masterData";

export default function MasterDataClient({
  initialClients,
  initialIndustries,
  initialLocations
}: {
  initialClients: MasterClient[],
  initialIndustries: MasterIndustry[],
  initialLocations: MasterLocation[]
}) {
  const [activeTab, setActiveTab] = useState<"clients" | "industries" | "locations">("clients");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importType, setImportType] = useState<"clients" | "industries" | "locations">("clients");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editInitialData, setEditInitialData] = useState<any>(null);

  const openImport = (type: "clients" | "industries" | "locations") => {
    setImportType(type);
    setIsImportModalOpen(true);
  };

  const openEdit = (data?: any) => {
    setEditInitialData(data || null);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this entry?")) return;
    try {
      if (activeTab === "clients") await deleteMasterClientAction(id);
      else if (activeTab === "industries") await deleteMasterIndustryAction(id);
      else if (activeTab === "locations") await deleteMasterLocationAction(id);
      toast.success("Deleted successfully!");
    } catch (e: any) {
      toast.error(e.message || "Failed to delete");
    }
  };

  return (
    <div className="max-w-screen-xl mx-auto pb-10">
      <div className="text-[14px] text-gray-500 mb-1">Admin / Master Data</div>
      <h1 className="text-3xl font-serif font-bold text-[#133255] mb-8 tracking-tight flex items-center gap-3">
        <Database className="w-8 h-8 text-[#D8B15B]" />
        Master Data Hub
      </h1>
      
      <p className="text-gray-600 mb-8 max-w-2xl">
        Master Data serves as the system dictionary. Importing records here will automatically power the smart autocomplete and dropdown menus across the entire application for data entry.
      </p>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button 
          onClick={() => setActiveTab("clients")}
          className={`py-3 px-6 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'clients' ? 'border-[#133255] text-[#133255]' : 'border-transparent text-gray-400 hover:text-gray-700'}`}
        >
          <Building2 className="w-4 h-4" /> Client Dictionary ({initialClients.length})
        </button>
        <button 
          onClick={() => setActiveTab("industries")}
          className={`py-3 px-6 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'industries' ? 'border-[#133255] text-[#133255]' : 'border-transparent text-gray-400 hover:text-gray-700'}`}
        >
          <Briefcase className="w-4 h-4" /> Industries ({initialIndustries.length})
        </button>
        <button 
          onClick={() => setActiveTab("locations")}
          className={`py-3 px-6 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'locations' ? 'border-[#133255] text-[#133255]' : 'border-transparent text-gray-400 hover:text-gray-700'}`}
        >
          <MapPin className="w-4 h-4" /> Locations ({initialLocations.length})
        </button>
      </div>

      {/* Action Bar */}
      <div className="flex justify-end mb-6 gap-3">
        <button 
          onClick={() => openEdit()}
          className="h-10 px-5 rounded-md bg-white border border-gray-300 text-gray-700 text-sm font-bold shadow-sm hover:bg-gray-50 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add New
        </button>
        <button 
          onClick={() => openImport(activeTab)}
          className="h-10 px-6 rounded-md bg-[#D8B15B] text-[#133255] text-sm font-bold shadow-sm hover:bg-[#e8c97a] transition-colors flex items-center gap-2"
        >
          <Upload className="w-4 h-4" /> Import {activeTab}
        </button>
      </div>

      {/* Tables */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {activeTab === "clients" && (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 font-semibold text-gray-500">Company Name</th>
                <th className="px-6 py-3 font-semibold text-gray-500">Industry</th>
                <th className="px-6 py-3 font-semibold text-gray-500">HR Leader</th>
                <th className="px-6 py-3 font-semibold text-gray-500">Owner</th>
                <th className="px-6 py-3 font-semibold text-gray-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {initialClients.length === 0 && <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">No master clients found. Import to populate dictionary.</td></tr>}
              {initialClients.map(c => (
                <tr key={c.id}>
                  <td className="px-6 py-3 font-medium text-[#133255]">{c.companyName}</td>
                  <td className="px-6 py-3 text-gray-600">{c.industry || "-"}</td>
                  <td className="px-6 py-3 text-gray-600">{c.hrLeaderName || "-"}</td>
                  <td className="px-6 py-3 text-gray-600">{c.accountOwner || "-"}</td>
                  <td className="px-6 py-3 text-right">
                    <button onClick={() => openEdit(c)} className="p-1.5 text-gray-400 hover:text-[#133255] hover:bg-gray-100 rounded-md transition-colors"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(c.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors ml-1"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === "industries" && (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 font-semibold text-gray-500">Sector / Industry</th>
                <th className="px-6 py-3 font-semibold text-gray-500">Includes / Consolidated From</th>
                <th className="px-6 py-3 font-semibold text-gray-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {initialIndustries.length === 0 && <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-400">No master industries found.</td></tr>}
              {initialIndustries.map(ind => (
                <tr key={ind.id}>
                  <td className="px-6 py-3 font-medium text-[#133255]">{ind.sectorName}</td>
                  <td className="px-6 py-3 text-gray-600 max-w-md truncate">{ind.includesConsolidatedFrom || "-"}</td>
                  <td className="px-6 py-3 text-right">
                    <button onClick={() => openEdit(ind)} className="p-1.5 text-gray-400 hover:text-[#133255] hover:bg-gray-100 rounded-md transition-colors"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(ind.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors ml-1"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === "locations" && (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 font-semibold text-gray-500">Standardized Location</th>
                <th className="px-6 py-3 font-semibold text-gray-500">Raw Entry</th>
                <th className="px-6 py-3 font-semibold text-gray-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {initialLocations.length === 0 && <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-400">No master locations found.</td></tr>}
              {initialLocations.map(loc => (
                <tr key={loc.id}>
                  <td className="px-6 py-3 font-medium text-[#133255]">{loc.standardizedLocation}</td>
                  <td className="px-6 py-3 text-gray-600">{loc.rawEntry}</td>
                  <td className="px-6 py-3 text-right">
                    <button onClick={() => openEdit(loc)} className="p-1.5 text-gray-400 hover:text-[#133255] hover:bg-gray-100 rounded-md transition-colors"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(loc.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors ml-1"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <MasterDataImportModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
        type={importType} 
      />
      <MasterDataEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        type={activeTab}
        initialData={editInitialData}
      />
    </div>
  );
}

