"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Send, CheckCircle2, Clock, AlertCircle, ChevronDown, ChevronUp, Loader2, RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";
import { getNextStepsTasksAction, updateNextStepsTaskStatusAction } from "@/actions/client-command-centre";

interface ClientNextStepsTasksPanelProps {
  mandateId: number;
}

type Task = {
  id: number;
  mandateId: number;
  clientId: string | null;
  selectedSteps: string[];
  freeTextComment: string | null;
  submittedByName: string | null;
  submittedAt: Date | string | null;
  status: string | null;
  acknowledgedBy: string | null;
  acknowledgedAt: Date | string | null;
  completedBy: string | null;
  completedAt: Date | string | null;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  Open: { label: "Open", color: "bg-amber-100 text-amber-800 border-amber-300", icon: AlertCircle },
  Acknowledged: { label: "Acknowledged", color: "bg-blue-100 text-blue-800 border-blue-300", icon: Clock },
  InProgress: { label: "In Progress", color: "bg-indigo-100 text-indigo-800 border-indigo-300", icon: Clock },
  Completed: { label: "Completed", color: "bg-emerald-100 text-emerald-800 border-emerald-300", icon: CheckCircle2 },
};

function formatDate(d: Date | string | null) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function TaskRow({ task, onStatusChange }: { task: Task; onStatusChange: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);
  const statusCfg = STATUS_CONFIG[task.status || "Open"] || STATUS_CONFIG.Open;
  const StatusIcon = statusCfg.icon;

  const handleStatusUpdate = async (newStatus: "Acknowledged" | "InProgress" | "Completed") => {
    setUpdating(true);
    try {
      await updateNextStepsTaskStatusAction({ taskId: task.id, status: newStatus });
      toast.success(`Task marked as ${newStatus}`);
      onStatusChange();
    } catch (e: any) {
      toast.error(e.message || "Failed to update task");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <div
        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <StatusIcon className={`w-4 h-4 shrink-0 ${task.status === "Completed" ? "text-emerald-600" : task.status === "Acknowledged" || task.status === "InProgress" ? "text-blue-600" : "text-amber-600"}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-gray-900 truncate">
              {task.submittedByName || "Client"}
            </span>
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${statusCfg.color}`}>
              {statusCfg.label}
            </span>
            <span className="text-[11px] text-gray-400">{formatDate(task.submittedAt)}</span>
          </div>
          <div className="text-[11px] text-gray-500 truncate mt-0.5">
            {(task.selectedSteps || []).slice(0, 2).join(" · ")}
            {(task.selectedSteps || []).length > 2 && ` +${(task.selectedSteps || []).length - 2} more`}
          </div>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
      </div>

      {expanded && (
        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 space-y-3">
          {/* Actions checklist */}
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Requested Actions</p>
            {(task.selectedSteps || []).map((step, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-gray-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#133255] shrink-0" />
                <span>{step}</span>
              </div>
            ))}
          </div>

          {task.freeTextComment && (
            <div>
              <p className="text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">Additional Notes</p>
              <p className="text-xs text-gray-700 bg-white rounded-lg border border-gray-200 p-2.5 italic">
                "{task.freeTextComment}"
              </p>
            </div>
          )}

          {/* Status trail */}
          {(task.acknowledgedBy || task.completedBy) && (
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Status Trail</p>
              {task.acknowledgedBy && (
                <div className="text-[11px] text-gray-500">
                  Acknowledged by <span className="font-medium text-gray-700">{task.acknowledgedBy}</span> · {formatDate(task.acknowledgedAt)}
                </div>
              )}
              {task.completedBy && (
                <div className="text-[11px] text-gray-500">
                  Completed by <span className="font-medium text-gray-700">{task.completedBy}</span> · {formatDate(task.completedAt)}
                </div>
              )}
            </div>
          )}

          {/* Status actions */}
          {task.status !== "Completed" && (
            <div className="flex gap-2 pt-1">
              {task.status === "Open" && (
                <button
                  onClick={() => handleStatusUpdate("Acknowledged")}
                  disabled={updating}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {updating && <Loader2 className="w-3 h-3 animate-spin" />}
                  Acknowledge
                </button>
              )}
              {(task.status === "Open" || task.status === "Acknowledged") && (
                <button
                  onClick={() => handleStatusUpdate("InProgress")}
                  disabled={updating}
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {updating && <Loader2 className="w-3 h-3 animate-spin" />}
                  Mark In Progress
                </button>
              )}
              <button
                onClick={() => handleStatusUpdate("Completed")}
                disabled={updating}
                className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5"
              >
                {updating && <Loader2 className="w-3 h-3 animate-spin" />}
                Mark Completed
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ClientNextStepsTasksPanel({ mandateId }: ClientNextStepsTasksPanelProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadTasks = useCallback(async () => {
    try {
      const data = await getNextStepsTasksAction(mandateId);
      setTasks(data as Task[]);
    } catch (e) {
      // silently fail - not critical
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [mandateId]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadTasks();
  };

  const openCount = tasks.filter(t => t.status !== "Completed").length;

  return (
    <div className="neo-table">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Send className="w-4 h-4 text-[#133255]" />
          <h3 className="font-bold text-gray-900 text-sm">Client Next Steps Tasks</h3>
          {openCount > 0 && (
            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[11px] font-bold rounded-full border border-amber-300">
              {openCount} open
            </span>
          )}
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="flex items-center gap-2 py-6 justify-center text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-xs">Loading tasks...</span>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-6 text-gray-400">
            <Send className="w-6 h-6 mx-auto mb-2 opacity-40" />
            <p className="text-xs font-medium">No client tasks yet</p>
            <p className="text-[11px] mt-0.5">Next Steps submitted from the client portal will appear here.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map(task => (
              <TaskRow key={task.id} task={task} onStatusChange={loadTasks} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
