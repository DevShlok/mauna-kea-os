"use client";

import React, { useState } from "react";
import { REFERENCE_QUESTIONS } from "@/lib/referenceQuestions";
import { 
  createReferenceCheckAction, 
  updateReferenceCheckAction, 
  deleteReferenceCheckAction, 
  toggleClientShareAction, 
  markCandidateVerifiedAction 
} from "@/actions/reference-checks";
import { VerifiedBadge } from "@/components/ui/StatusBadge";
import { 
  ShieldCheck, 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  Clock, 
  Building2, 
  User, 
  HelpCircle 
} from "lucide-react";
import toast from "react-hot-toast";
import { ReferenceCheck, CandidateVerification } from "@/db/schema";

interface Props {
  candId: string;
  candidateName: string;
  checks: ReferenceCheck[];
  verificationStatus?: CandidateVerification | null;
  currentUserName?: string;
}

export function ReferenceCheckPanel({ 
  candId, 
  candidateName, 
  checks, 
  verificationStatus, 
  currentUserName = "Consultant" 
}: Props) {
  const isVerified = verificationStatus?.status === "Verified";
  const [showModal, setShowModal] = useState(false);
  const [editingCheck, setEditingCheck] = useState<ReferenceCheck | null>(null);

  // Form State
  const [refereeName, setRefereeName] = useState("");
  const [refereeRelationship, setRefereeRelationship] = useState("Peer");
  const [refereeCompany, setRefereeCompany] = useState("");
  const [conductedBy, setConductedBy] = useState(currentUserName);
  const [status, setStatus] = useState("In Progress");
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [summaryPositives, setSummaryPositives] = useState("");
  const [summaryImprovements, setSummaryImprovements] = useState("");
  const [summaryNeutral, setSummaryNeutral] = useState("");
  const [isSharedWithClient, setIsSharedWithClient] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState(false);

  const openCreateModal = () => {
    setEditingCheck(null);
    setRefereeName("");
    setRefereeRelationship("Peer");
    setRefereeCompany("");
    setConductedBy(currentUserName);
    setStatus("In Progress");
    setResponses({});
    setSummaryPositives("");
    setSummaryImprovements("");
    setSummaryNeutral("");
    setIsSharedWithClient(false);
    setShowModal(true);
  };

  const openEditModal = (check: ReferenceCheck) => {
    setEditingCheck(check);
    setRefereeName(check.refereeName || "");
    setRefereeRelationship(check.refereeRelationship || "Peer");
    setRefereeCompany(check.refereeCompany || "");
    setConductedBy(check.conductedBy || currentUserName);
    setStatus(check.status || "In Progress");
    setResponses((check.responses as Record<string, string>) || {});
    setSummaryPositives(check.summaryPositives || "");
    setSummaryImprovements(check.summaryImprovements || "");
    setSummaryNeutral(check.summaryNeutral || "");
    setIsSharedWithClient(!!check.isSharedWithClient);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingCheck) {
        await updateReferenceCheckAction(editingCheck.id, {
          conductedBy,
          refereeName,
          refereeRelationship,
          refereeCompany,
          status,
          responses,
          summaryPositives,
          summaryImprovements,
          summaryNeutral,
          isSharedWithClient,
        });
        toast.success("Reference check updated");
      } else {
        await createReferenceCheckAction({
          candId,
          conductedBy,
          refereeName,
          refereeRelationship,
          refereeCompany,
          status,
          responses,
          summaryPositives,
          summaryImprovements,
          summaryNeutral,
          isSharedWithClient,
        });
        toast.success("Reference check added");
      }
      setShowModal(false);
    } catch (err: any) {
      toast.error("Failed to save reference check");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this reference check?")) return;
    try {
      await deleteReferenceCheckAction(id, candId);
      toast.success("Reference check deleted");
    } catch (err: any) {
      toast.error("Failed to delete reference check");
    }
  };

  const handleToggleShare = async (id: number, currentShare: boolean) => {
    try {
      await toggleClientShareAction(id, !currentShare, candId);
      toast.success(!currentShare ? "Shared with client" : "Hidden from client");
    } catch (err: any) {
      toast.error("Failed to update client share setting");
    }
  };

  const handleMarkVerified = async () => {
    try {
      await markCandidateVerifiedAction(candId, currentUserName);
      toast.success("Candidate profile verified!");
    } catch (err: any) {
      toast.error("Failed to mark candidate as verified");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Verification Control */}
      <div className="neo-card p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {isVerified ? (
            <VerifiedBadge size="lg" />
          ) : (
            <div className="flex items-center gap-2 text-slate-600 font-semibold text-sm bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Verification Status: {verificationStatus?.status || "Not Started"}</span>
            </div>
          )}
          {verificationStatus?.verifiedBy && (
            <span className="text-xs text-slate-500">
              Verified by <strong className="text-slate-700">{verificationStatus.verifiedBy}</strong>
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {!isVerified && (
            <button
              onClick={handleMarkVerified}
              className="neo-btn px-4 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Mark as Fully Verified
            </button>
          )}

          <button
            onClick={openCreateModal}
            className="neo-btn-gold px-5 py-2 text-xs font-bold flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add Reference Check
          </button>
        </div>
      </div>

      {/* Reference Checks List */}
      {checks.length === 0 ? (
        <div className="neo-card p-8 text-center text-slate-500 space-y-2">
          <HelpCircle className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="font-semibold text-sm">No reference checks logged yet.</p>
          <p className="text-xs text-slate-400">Add candidate reference checks to verify their background and build trust.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {checks.map((check) => (
            <div key={check.id} className="neo-card p-5 space-y-3 relative flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#133255] text-sm">
                        {check.refereeRelationship} · {check.refereeCompany || "Unknown Co."}
                      </span>
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                        check.status === "Completed" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                      }`}>
                        {check.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Referee: <span className="text-slate-600 font-medium">{check.refereeName}</span> (Internal only)
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleShare(check.id, !!check.isSharedWithClient)}
                      title={check.isSharedWithClient ? "Shared with Client (click to hide)" : "Hidden from Client (click to share)"}
                      className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors ${
                        check.isSharedWithClient 
                          ? "bg-blue-50 text-blue-700 border-blue-200" 
                          : "bg-slate-50 text-slate-400 border-slate-200 hover:text-slate-600"
                      }`}
                    >
                      {check.isSharedWithClient ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => openEditModal(check)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(check.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Summaries */}
                <div className="space-y-2 text-xs">
                  {check.summaryPositives && (
                    <div className="bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-100 text-emerald-900">
                      <strong className="block text-[11px] text-emerald-800 font-bold mb-0.5">Key Positives:</strong>
                      {check.summaryPositives}
                    </div>
                  )}
                  {check.summaryImprovements && (
                    <div className="bg-amber-50/60 p-2.5 rounded-lg border border-amber-100 text-amber-900">
                      <strong className="block text-[11px] text-amber-800 font-bold mb-0.5">Growth Areas:</strong>
                      {check.summaryImprovements}
                    </div>
                  )}
                  {check.summaryNeutral && (
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-700">
                      <strong className="block text-[11px] text-slate-600 font-bold mb-0.5">Observations:</strong>
                      {check.summaryNeutral}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Conducted by: {check.conductedBy || "MK Team"}</span>
                <span>{check.createdAt ? new Date(check.createdAt).toLocaleDateString() : ""}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Form for Add/Edit Reference Check */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 space-y-6 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-4">
              <h2 className="text-lg font-bold text-[#133255]">
                {editingCheck ? "Edit Reference Check" : "Add New Reference Check"}
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-5">
              {/* Referee Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Referee Name <span className="text-amber-600 font-normal">(Internal Only - Hidden from candidate & client)</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={refereeName}
                    onChange={(e) => setRefereeName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3 py-2 neo-inset text-xs font-semibold text-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Referee Relationship</label>
                  <select
                    value={refereeRelationship}
                    onChange={(e) => setRefereeRelationship(e.target.value)}
                    className="w-full px-3 py-2 neo-inset text-xs font-semibold text-slate-800 outline-none"
                  >
                    <option value="Peer">Peer</option>
                    <option value="Senior">Senior / Manager</option>
                    <option value="Reportee">Reportee / Direct Report</option>
                    <option value="Client">Client / Stakeholder</option>
                    <option value="Cross-functional">Cross-functional Partner</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Referee Company</label>
                  <input
                    type="text"
                    value={refereeCompany}
                    onChange={(e) => setRefereeCompany(e.target.value)}
                    placeholder="e.g. Ex-ITC Limited"
                    className="w-full px-3 py-2 neo-inset text-xs font-semibold text-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Conducted By</label>
                  <input
                    type="text"
                    value={conductedBy}
                    onChange={(e) => setConductedBy(e.target.value)}
                    className="w-full px-3 py-2 neo-inset text-xs font-semibold text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Check Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="px-3 py-2 neo-inset text-xs font-semibold text-slate-800 outline-none"
                  >
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-4">
                  <input
                    type="checkbox"
                    id="shareClient"
                    checked={isSharedWithClient}
                    onChange={(e) => setIsSharedWithClient(e.target.checked)}
                    className="w-4 h-4 rounded text-[#133255]"
                  />
                  <label htmlFor="shareClient" className="text-xs font-semibold text-slate-700 cursor-pointer">
                    Share structured check with Client Portal
                  </label>
                </div>
              </div>

              {/* Standardized 10 Questions Accordion */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpandedQuestions(!expandedQuestions)}
                  className="w-full px-4 py-3 bg-slate-50 flex items-center justify-between font-bold text-xs text-[#133255] hover:bg-slate-100 transition-colors"
                >
                  <span>Standardized 10 Reference Questions ({Object.keys(responses).length}/10 answered)</span>
                  {expandedQuestions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {expandedQuestions && (
                  <div className="p-4 space-y-4 bg-white border-t border-slate-200 max-h-80 overflow-y-auto">
                    {REFERENCE_QUESTIONS.map((q, idx) => (
                      <div key={idx} className="space-y-1">
                        <label className="block text-[11px] font-bold text-slate-700">
                          Q{idx + 1}: {q}
                        </label>
                        <textarea
                          rows={2}
                          value={responses[`Q${idx + 1}`] || ""}
                          onChange={(e) => setResponses({ ...responses, [`Q${idx + 1}`]: e.target.value })}
                          placeholder="Verbatim or summarized answer..."
                          className="w-full p-2 neo-inset text-xs font-medium text-slate-800 outline-none"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Structured Summaries (This is what is shown to candidate/client) */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-[#133255] uppercase tracking-wider">
                  Constructive Summaries (Shown to Candidate & Client)
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-emerald-800 mb-1">
                    Key Strengths & Positives
                  </label>
                  <textarea
                    rows={2}
                    value={summaryPositives}
                    onChange={(e) => setSummaryPositives(e.target.value)}
                    placeholder="Constructive positive highlights..."
                    className="w-full p-2.5 neo-inset text-xs font-medium text-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-amber-800 mb-1">
                    Constructive Growth Areas / Room for Improvement
                  </label>
                  <textarea
                    rows={2}
                    value={summaryImprovements}
                    onChange={(e) => setSummaryImprovements(e.target.value)}
                    placeholder="Constructive improvement feedback..."
                    className="w-full p-2.5 neo-inset text-xs font-medium text-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Neutral Observations & Leadership Style
                  </label>
                  <textarea
                    rows={2}
                    value={summaryNeutral}
                    onChange={(e) => setSummaryNeutral(e.target.value)}
                    placeholder="General observations on working style..."
                    className="w-full p-2.5 neo-inset text-xs font-medium text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 neo-btn text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 neo-btn-primary text-xs font-bold"
                >
                  {isSubmitting ? "Saving..." : "Save Reference Check"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
