"use client";

import React, { useState } from "react";
import { GuidanceBlock } from "@/db/schema";
import {
  upsertGuidanceBlockAction,
  deleteGuidanceBlockAction,
} from "@/actions/guidance";
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  X,
  Search,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";

interface Props {
  initialBlocks: GuidanceBlock[];
}

export function GuidanceAdminClient({ initialBlocks }: Props) {
  const [blocks, setBlocks] = useState<GuidanceBlock[]>(initialBlocks);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<GuidanceBlock | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    tier: "A",
    targetRole: "*",
    title: "",
    body: "",
  });

  const openAddModal = () => {
    setEditingBlock(null);
    setFormData({ tier: "A", targetRole: "*", title: "", body: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (block: GuidanceBlock) => {
    setEditingBlock(block);
    setFormData({
      tier: block.tier,
      targetRole: block.targetRole || "*",
      title: block.title,
      body: block.body,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.body.trim()) {
      toast.error("Please fill in both title and body.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await upsertGuidanceBlockAction({
        id: editingBlock?.id,
        ...formData,
      });

      if (res.success) {
        toast.success(editingBlock ? "Guidance block updated." : "Guidance block created.");
        setIsModalOpen(false);
        // Refresh local stateoptimistically
        window.location.reload();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save block.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to deactivate this guidance block?")) return;

    try {
      await deleteGuidanceBlockAction(id);
      setBlocks((prev) => prev.filter((b) => b.id !== id));
      toast.success("Guidance block deactivated.");
    } catch (err: any) {
      toast.error(err.message || "Failed to deactivate block.");
    }
  };

  const filteredBlocks = blocks.filter((b) => {
    const q = searchQuery.toLowerCase();
    return (
      b.title.toLowerCase().includes(q) ||
      b.body.toLowerCase().includes(q) ||
      b.tier.toLowerCase().includes(q) ||
      (b.targetRole && b.targetRole.toLowerCase().includes(q))
    );
  });

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-blue-50 text-blue-800 border border-blue-100">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Consultant Guidance Library</h1>
            <p className="text-sm text-slate-500">
              Curate executive career guidance notes keyed by Assessment Tier & Target Role
            </p>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#133255] text-white font-medium text-sm hover:bg-[#1e4570] transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Guidance Block
        </button>
      </div>

      {/* Search & Stats */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search guidance by title, tier, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Showing {filteredBlocks.length} of {blocks.length} blocks
        </div>
      </div>

      {/* Blocks Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Tier</th>
              <th className="px-6 py-4">Target Role</th>
              <th className="px-6 py-4">Title & Details</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredBlocks.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">
                  No guidance blocks found matching your filter.
                </td>
              </tr>
            ) : (
              filteredBlocks.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-800">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                        b.tier === "A"
                          ? "bg-emerald-100 text-emerald-800"
                          : b.tier === "B"
                          ? "bg-blue-100 text-blue-800"
                          : b.tier === "C"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-purple-100 text-purple-800"
                      }`}
                    >
                      {b.tier === "*" ? "All Tiers (*)" : `Tier ${b.tier}`}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium">
                    {b.targetRole === "*" ? "All Roles (*)" : b.targetRole}
                  </td>
                  <td className="px-6 py-4 max-w-md">
                    <div className="font-bold text-slate-800">{b.title}</div>
                    <div className="text-xs text-slate-500 line-clamp-2 mt-0.5">{b.body}</div>
                  </td>
                  <td className="px-6 py-4">
                    {b.isActive ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => openEditModal(b)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      title="Edit Block"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {b.isActive && (
                      <button
                        onClick={() => handleDelete(b.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Deactivate Block"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-lg">
                {editingBlock ? "Edit Guidance Block" : "New Guidance Block"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Target Tier
                  </label>
                  <select
                    value={formData.tier}
                    onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="A">Tier A (≥ 80)</option>
                    <option value="B">Tier B (60 – 79)</option>
                    <option value="C">Tier C (&lt; 60)</option>
                    <option value="*">Wildcard (* - All Tiers)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Target Role
                  </label>
                  <select
                    value={formData.targetRole}
                    onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="*">Wildcard (* - All Roles)</option>
                    <option value="CFO">CFO</option>
                    <option value="CHRO">CHRO</option>
                    <option value="CTO">CTO</option>
                    <option value="CEO">CEO / MD</option>
                    <option value="COO">COO</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Navigating Board-Level Compensation Expectations"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Guidance Content (Body)
                </label>
                <textarea
                  rows={5}
                  placeholder="Write detailed recommendations and consultant advice..."
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium bg-[#133255] text-white rounded-xl hover:bg-[#1e4570] disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : editingBlock ? "Save Changes" : "Create Block"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
