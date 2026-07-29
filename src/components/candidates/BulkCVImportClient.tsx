"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, CheckCircle2, AlertCircle, Loader2, FileText, X, PlayCircle } from "lucide-react";
import { uploadAndDispatchDirectEvent } from "@/actions/candidates";

type UploadStatus = "pending" | "uploading" | "processing" | "success" | "error";

interface FileState {
  id: string;
  file: File;
  status: UploadStatus;
  progress: number;
  error?: string;
}

export default function BulkCVImportClient() {
  const [files, setFiles] = useState<FileState[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      status: "pending" as UploadStatus,
      progress: 0,
    }));
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    }
  });

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const startUpload = async () => {
    setIsUploading(true);

    for (let i = 0; i < files.length; i++) {
      if (files[i].status !== "pending") continue;

      const fileState = files[i];

      // Mark as uploading
      setFiles(prev => prev.map(f => f.id === fileState.id ? { ...f, status: "uploading" } : f));

      try {
        const formData = new FormData();
        formData.append("file", fileState.file);

        await uploadAndDispatchDirectEvent(formData);

        setFiles(prev => prev.map(f => f.id === fileState.id ? { ...f, status: "success", progress: 100 } : f));
      } catch (err: any) {
        setFiles(prev => prev.map(f => f.id === fileState.id ? { ...f, status: "error", error: err.message } : f));
      }
    }

    setIsUploading(false);
  };

  const pendingCount = files.filter(f => f.status === "pending").length;
  const successCount = files.filter(f => f.status === "success").length;
  const errorCount = files.filter(f => f.status === "error").length;

  const statusBadge = (status: UploadStatus, error?: string) => {
    switch (status) {
      case "pending":
        return <span className="text-[12px] font-semibold text-[#6b7a99] bg-[#f0f4f8] px-2 py-0.5 rounded-full">Pending</span>;
      case "uploading":
        return (
          <span className="flex items-center gap-1.5 text-[12px] font-semibold text-[#1d4ed8]">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading
          </span>
        );
      case "processing":
        return (
          <span className="flex items-center gap-1.5 text-[12px] font-semibold text-[#7c3aed]">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing
          </span>
        );
      case "success":
        return (
          <span className="flex items-center gap-1.5 text-[12px] font-semibold text-[#137a43]">
            <CheckCircle2 className="w-3.5 h-3.5" /> Done
          </span>
        );
      case "error":
        return (
          <span className="flex items-center gap-1.5 text-[12px] font-semibold text-[#c92a2a]" title={error}>
            <AlertCircle className="w-3.5 h-3.5" /> Failed
          </span>
        );
    }
  };

  return (
    <div className="space-y-5">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200 ${
          isDragActive
            ? "border-[#133255] bg-[#DCE5F4] scale-[1.01]"
            : "border-[#D4E0F0] bg-white hover:border-[#133255] hover:bg-[#f4f7fd]"
        }`}
      >
        <input {...getInputProps()} />
        <div className={`w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center transition-colors ${isDragActive ? "bg-[#133255]" : "bg-[#DCE5F4]"}`}>
          <UploadCloud className={`w-7 h-7 ${isDragActive ? "text-white" : "text-[#133255]"}`} />
        </div>
        {isDragActive ? (
          <p className="text-[17px] font-bold text-[#133255]">Release to add files…</p>
        ) : (
          <div>
            <p className="text-[16px] font-bold text-[#133255]">Drag &amp; drop CV files here</p>
            <p className="text-[13.5px] text-[#6b7a99] mt-1.5">
              or <span className="text-[#1d4ed8] underline underline-offset-2 font-semibold">click to browse</span> — only PDF files are accepted
            </p>
          </div>
        )}
      </div>

      {/* File Queue */}
      {files.length > 0 && (
        <div className="bg-white border border-[#e4e8f0] rounded-2xl overflow-hidden shadow-sm">
          {/* Header */}
          <div className="px-5 py-3.5 border-b border-[#e4e8f0] flex items-center justify-between bg-[#fafbfd]">
            <div className="flex items-center gap-3">
              <span className="text-[14px] font-bold text-[#133255]">
                {files.length} file{files.length !== 1 ? "s" : ""} selected
              </span>
              {successCount > 0 && (
                <span className="text-[12px] font-semibold text-[#137a43] bg-[#e0f5e9] px-2 py-0.5 rounded-full">
                  {successCount} done
                </span>
              )}
              {errorCount > 0 && (
                <span className="text-[12px] font-semibold text-[#c92a2a] bg-[#fae6e6] px-2 py-0.5 rounded-full">
                  {errorCount} failed
                </span>
              )}
            </div>
            <button
              onClick={startUpload}
              disabled={isUploading || pendingCount === 0}
              className="h-9 px-4 bg-[#133255] text-white rounded-xl text-[13px] font-bold hover:bg-[#1a4fa8] transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing…
                </>
              ) : (
                <>
                  <PlayCircle className="w-4 h-4" />
                  Start Import ({pendingCount})
                </>
              )}
            </button>
          </div>

          {/* File list */}
          <div className="divide-y divide-[#f0f4f8] max-h-[420px] overflow-y-auto">
            {files.map(file => (
              <div
                key={file.id}
                className={`px-5 py-3.5 flex items-center justify-between transition-colors ${
                  file.status === "success"
                    ? "bg-[#f0fff6]"
                    : file.status === "error"
                    ? "bg-[#fff8f8]"
                    : "hover:bg-[#f8fafc]"
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    file.status === "success" ? "bg-[#e0f5e9]" : file.status === "error" ? "bg-[#fae6e6]" : "bg-[#DCE5F4]"
                  }`}>
                    <FileText className={`w-4.5 h-4.5 ${
                      file.status === "success" ? "text-[#137a43]" : file.status === "error" ? "text-[#c92a2a]" : "text-[#133255]"
                    }`} size={18} />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[13.5px] font-semibold text-[#111] truncate">{file.file.name}</p>
                    <p className="text-[12px] text-[#6b7a99]">{(file.file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  {statusBadge(file.status, file.error)}
                  {file.status === "pending" && (
                    <button
                      onClick={() => removeFile(file.id)}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[#9ca8be] hover:text-[#c92a2a] hover:bg-[#fae6e6] transition-all"
                      title="Remove"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Footer summary */}
          {(successCount === files.length && files.length > 0) && (
            <div className="px-5 py-3 border-t border-[#e4e8f0] bg-[#f0fff6] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#137a43]" />
              <span className="text-[13px] font-semibold text-[#137a43]">
                All {successCount} file{successCount !== 1 ? "s" : ""} processed successfully!
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
