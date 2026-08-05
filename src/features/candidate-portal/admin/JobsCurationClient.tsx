"use client";

import React, { useState } from "react";
import { CandidateJob } from "@/db/schema";
import {
  createJobAction,
  updateJobAction,
  toggleJobActiveAction,
  getJobInterestsAction,
} from "@/actions/candidate-jobs";
import {
  Briefcase,
  Plus,
  Edit,
  Eye,
  Lock,
  Globe,
  MapPin,
  IndianRupee,
  Users,
  CheckCircle2,
  XCircle,
  X,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";

interface Props {
  initialJobs: CandidateJob[];
  sectors: string[];
}

export default function JobsCurationClient({ initialJobs, sectors }: Props) {
  const [jobs, setJobs] = useState<CandidateJob[]>(initialJobs);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<CandidateJob | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Interest Drawer State
  const [selectedJobForAnalytics, setSelectedJobForAnalytics] = useState<CandidateJob | null>(null);
  const [interestsList, setInterestsList] = useState<any[]>([]);
  const [isLoadingInterests, setIsLoadingInterests] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    companyDisplay: "",
    isConfidential: false,
    location: "",
    ctcRangeMin: "",
    ctcRangeMax: "",
    experienceMin: "",
    experienceMax: "",
    sector: "",
    description: "",
    highlights: [""] as string[],
    targetCandIdsStr: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openCreateModal = () => {
    setEditingJob(null);
    setFormData({
      title: "",
      companyDisplay: "",
      isConfidential: false,
      location: "",
      ctcRangeMin: "",
      ctcRangeMax: "",
      experienceMin: "",
      experienceMax: "",
      sector: sectors[0] || "",
      description: "",
      highlights: [""],
      targetCandIdsStr: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (job: CandidateJob) => {
    setEditingJob(job);
    setFormData({
      title: job.title || "",
      companyDisplay: job.companyDisplay || "",
      isConfidential: !!job.isConfidential,
      location: job.location || "",
      ctcRangeMin: job.ctcRangeMin?.toString() || "",
      ctcRangeMax: job.ctcRangeMax?.toString() || "",
      experienceMin: job.experienceMin?.toString() || "",
      experienceMax: job.experienceMax?.toString() || "",
      sector: job.sector || "",
      description: job.description || "",
      highlights: (job.highlights as string[])?.length ? (job.highlights as string[]) : [""],
      targetCandIdsStr: (job.targetCandIds as string[])?.join(", ") || "",
    });
    setIsModalOpen(true);
  };

  const handleToggleActive = async (job: CandidateJob) => {
    const nextState = !job.isActive;
    setJobs((prev) =>
      prev.map((j) => (j.id === job.id ? { ...j, isActive: nextState } : j))
    );
    try {
      await toggleJobActiveAction(job.id, nextState);
      toast.success(nextState ? "Job activated" : "Job deactivated");
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: formData.title.trim(),
        companyDisplay: formData.companyDisplay.trim() || undefined,
        isConfidential: formData.isConfidential,
        location: formData.location.trim() || undefined,
        ctcRangeMin: formData.ctcRangeMin ? parseInt(formData.ctcRangeMin) : undefined,
        ctcRangeMax: formData.ctcRangeMax ? parseInt(formData.ctcRangeMax) : undefined,
        experienceMin: formData.experienceMin ? parseInt(formData.experienceMin) : undefined,
        experienceMax: formData.experienceMax ? parseInt(formData.experienceMax) : undefined,
        sector: formData.sector || undefined,
        description: formData.description.trim() || undefined,
        highlights: formData.highlights.filter((h) => h.trim().length > 0),
        targetCandIds: formData.targetCandIdsStr
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };

      if (editingJob) {
        const res = await updateJobAction(editingJob.id, payload);
        if (res.success && res.job) {
          setJobs((prev) => prev.map((j) => (j.id === editingJob.id ? res.job! : j)));
          toast.success("Job post updated!");
        }
      } else {
        const res = await createJobAction(payload);
        if (res.success && res.job) {
          setJobs((prev) => [res.job!, ...prev]);
          toast.success("Curated job post created!");
        }
      }
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save job");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAnalytics = async (job: CandidateJob) => {
    setSelectedJobForAnalytics(job);
    setIsLoadingInterests(true);
    try {
      const list = await getJobInterestsAction(job.id);
      setInterestsList(list);
    } catch {
      toast.error("Failed to load interest responses");
    } finally {
      setIsLoadingInterests(false);
    }
  };

  const filteredJobs = jobs.filter((j) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      j.title.toLowerCase().includes(q) ||
      (j.companyDisplay && j.companyDisplay.toLowerCase().includes(q)) ||
      (j.sector && j.sector.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 neo-card p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#D8B15B] uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" /> Candidate Portal Curation
          </div>
          <h1 className="text-2xl font-serif font-bold text-[#133255]">
            Curated Executive Jobs Feed
          </h1>
          <p className="text-gray-500 text-xs mt-1">
            Post and manage confidential or direct executive positions displayed on candidate discovery portals.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 bg-[#133255] hover:bg-[#1d4d82] text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Curated Job
        </button>
      </div>

      {/* Filter & Table Container */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by title, company display, or sector..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#133255]"
            />
          </div>
          <span className="text-xs font-semibold text-gray-400">
            Total Roles: {filteredJobs.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/70 border-b border-gray-100 text-gray-400 uppercase tracking-wider font-bold text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Job Title</th>
                <th className="px-5 py-3.5">Company Display</th>
                <th className="px-5 py-3.5">Sector</th>
                <th className="px-5 py-3.5">CTC Range</th>
                <th className="px-5 py-3.5">Experience</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-400">
                    No curated job posts found. Click "+ Add Curated Job" to post one.
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-[#133255] text-sm flex items-center gap-2">
                        {job.title}
                        {job.isConfidential && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                            <Lock className="w-3 h-3" /> Confidential
                          </span>
                        )}
                      </div>
                      {job.location && (
                        <div className="text-gray-400 text-[11px] flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" /> {job.location}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 font-semibold text-gray-600">
                      {job.companyDisplay || <span className="text-gray-300">Default</span>}
                    </td>
                    <td className="px-5 py-4">
                      <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md text-[11px] font-semibold border border-indigo-100/60">
                        {job.sector || "General"}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-bold text-gray-800">
                      {job.ctcRangeMin || job.ctcRangeMax
                        ? `₹${job.ctcRangeMin || 0}L – ₹${job.ctcRangeMax || 0}L`
                        : "Undisclosed"}
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {job.experienceMin || job.experienceMax
                        ? `${job.experienceMin || 0}–${job.experienceMax || 0} yrs`
                        : "Flexible"}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => handleToggleActive(job)}
                        className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                          job.isActive
                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}
                      >
                        {job.isActive ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openAnalytics(job)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="View Candidate Signals"
                        >
                          <Users className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(job)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit Job Post"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Job Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-serif font-bold text-lg text-[#133255]">
                {editingJob ? "Edit Curated Job Post" : "Add Curated Executive Job"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Job Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chief Financial Officer"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#133255]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Company Display Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. A Leading FMCG Company"
                    value={formData.companyDisplay}
                    onChange={(e) => setFormData({ ...formData, companyDisplay: e.target.value })}
                    className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#133255]"
                  />
                  <span className="text-[10px] text-gray-400">
                    Visible to candidate if confidential
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Confidential Mode
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer pt-2">
                    <input
                      type="checkbox"
                      checked={formData.isConfidential}
                      onChange={(e) =>
                        setFormData({ ...formData, isConfidential: e.target.checked })
                      }
                      className="rounded border-gray-300 text-[#133255] focus:ring-[#133255]"
                    />
                    <span className="text-xs font-semibold text-gray-700">
                      Hide real company name from candidates
                    </span>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Gurgaon / Hybrid"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#133255]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Sector</label>
                  <select
                    value={formData.sector}
                    onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                    className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#133255]"
                  >
                    <option value="">Select Sector</option>
                    {sectors.map((sec) => (
                      <option key={sec} value={sec}>
                        {sec}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    CTC Range Min (Lakhs)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 150"
                    value={formData.ctcRangeMin}
                    onChange={(e) => setFormData({ ...formData, ctcRangeMin: e.target.value })}
                    className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#133255]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    CTC Range Max (Lakhs)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 200"
                    value={formData.ctcRangeMax}
                    onChange={(e) => setFormData({ ...formData, ctcRangeMax: e.target.value })}
                    className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#133255]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Min Exp (Years)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 18"
                    value={formData.experienceMin}
                    onChange={(e) =>
                      setFormData({ ...formData, experienceMin: e.target.value })
                    }
                    className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#133255]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Max Exp (Years)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 25"
                    value={formData.experienceMax}
                    onChange={(e) =>
                      setFormData({ ...formData, experienceMax: e.target.value })
                    }
                    className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#133255]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Role Overview / Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Brief description of the position, scope, reporting structure..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#133255]"
                  />
                </div>

                <div className="sm:col-span-2 space-y-2">
                  <label className="block text-xs font-bold text-gray-700">
                    Key Highlights (Bullet Points)
                  </label>
                  {formData.highlights.map((hl, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder={`Highlight #${idx + 1} (e.g. Direct report to Group MD)`}
                        value={hl}
                        onChange={(e) => {
                          const updated = [...formData.highlights];
                          updated[idx] = e.target.value;
                          setFormData({ ...formData, highlights: updated });
                        }}
                        className="flex-1 p-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#133255]"
                      />
                      {formData.highlights.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              highlights: formData.highlights.filter((_, i) => i !== idx),
                            });
                          }}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, highlights: [...formData.highlights, ""] })
                    }
                    className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                  >
                    + Add Highlight Bullet
                  </button>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Target Candidate IDs (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CAND-101, CAND-102 (Leave empty to show to all candidates)"
                    value={formData.targetCandIdsStr}
                    onChange={(e) =>
                      setFormData({ ...formData, targetCandIdsStr: e.target.value })
                    }
                    className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#133255]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#133255] hover:bg-[#1d4d82] rounded-lg shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : editingJob ? "Save Changes" : "Create Post"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Candidate Response Analytics Drawer */}
      {selectedJobForAnalytics && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-md h-full p-6 space-y-5 shadow-2xl overflow-y-auto flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                <div>
                  <h3 className="font-bold text-sm text-[#133255]">Candidate Signals</h3>
                  <p className="text-xs text-gray-400">{selectedJobForAnalytics.title}</p>
                </div>
                <button
                  onClick={() => setSelectedJobForAnalytics(null)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {isLoadingInterests ? (
                <div className="text-center py-10 text-gray-400 text-xs">Loading responses...</div>
              ) : interestsList.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-xs">
                  No interest signals recorded yet for this role.
                </div>
              ) : (
                <div className="space-y-3">
                  {interestsList.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/50 flex items-start justify-between gap-3"
                    >
                      <div>
                        <div className="font-bold text-xs text-[#133255]">{item.candName}</div>
                        <div className="text-[11px] text-gray-500">
                          {item.candDesignation} · {item.candCompany}
                        </div>
                        <div className="text-[10px] text-gray-400 mt-1">{item.candEmail}</div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                          item.status === "Interested"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedJobForAnalytics(null)}
              className="w-full py-2 bg-gray-100 text-gray-700 font-bold text-xs rounded-lg hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
