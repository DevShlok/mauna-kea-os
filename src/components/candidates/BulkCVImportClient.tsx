"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
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
    
    // We process sequentially or with slight concurrency to avoid spamming the browser
    for (let i = 0; i < files.length; i++) {
      if (files[i].status !== "pending") continue;
      
      const fileState = files[i];
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

  return (
    <div className="space-y-6">
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-indigo-500 bg-indigo-500/10' : 'border-neutral-700 bg-neutral-900 hover:border-neutral-500'
        }`}
      >
        <input {...getInputProps()} />
        <UploadCloud className="w-10 h-10 mx-auto text-neutral-400 mb-4" />
        {isDragActive ? (
          <p className="text-lg font-medium text-indigo-400">Drop the PDFs here ...</p>
        ) : (
          <div>
            <p className="text-lg font-medium text-white">Drag & drop some PDFs here, or click to select files</p>
            <p className="text-sm text-neutral-500 mt-2">Only .pdf files are supported</p>
          </div>
        )}
      </div>

      {files.length > 0 && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
            <h3 className="font-medium text-white">Selected Files ({files.length})</h3>
            <button
              onClick={startUpload}
              disabled={isUploading || files.every(f => f.status === "success")}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {isUploading ? "Uploading..." : "Start Processing"}
            </button>
          </div>
          <div className="divide-y divide-neutral-800 max-h-[400px] overflow-y-auto">
            {files.map(file => (
              <div key={file.id} className="p-4 flex items-center justify-between hover:bg-neutral-800/50">
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div className="w-8 h-8 rounded bg-neutral-800 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-neutral-400">PDF</span>
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-medium text-white truncate">{file.file.name}</p>
                    <p className="text-xs text-neutral-500">{(file.file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  {file.status === "pending" && (
                    <button onClick={() => removeFile(file.id)} className="text-neutral-500 hover:text-red-400 text-sm">Remove</button>
                  )}
                  {file.status === "uploading" && <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />}
                  {file.status === "processing" && <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />}
                  {file.status === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                  {file.status === "error" && (
                    <div className="flex items-center text-red-500" title={file.error}>
                      <AlertCircle className="w-5 h-5 mr-1" />
                      <span className="text-xs">Failed</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
