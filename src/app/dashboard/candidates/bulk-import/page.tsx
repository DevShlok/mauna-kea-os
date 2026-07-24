import BulkCVImportClient from "@/components/candidates/BulkCVImportClient";

export default function BulkImportPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Bulk CV Import</h1>
        <p className="text-sm text-neutral-400 mt-2">
          Drag and drop multiple PDF CVs directly. They will be uploaded and processed in the background automatically.
        </p>
      </div>
      
      <BulkCVImportClient />
    </div>
  );
}
