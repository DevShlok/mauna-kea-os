import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const ConfirmModal = ({ t, message, resolve }: { t: any, message: string, resolve: (v: boolean) => void }) => {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className={`${t.visible ? 'animate-in zoom-in-95' : 'animate-out zoom-out-95'} max-w-sm w-full bg-white shadow-2xl rounded-2xl pointer-events-auto flex flex-col p-6 border border-[#D4E0F0]`}>
        <h3 className="text-lg font-serif font-bold text-[#111] mb-2">Confirmation Required</h3>
        <p className="text-sm text-gray-500 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => {
              toast.dismiss(t.id);
              resolve(false);
            }}
            className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              resolve(true);
            }}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-bold shadow-sm transition-colors"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export const confirmDialog = (message: string): Promise<boolean> => {
  return new Promise((resolve) => {
    toast.custom((t) => <ConfirmModal t={t} message={message} resolve={resolve} />, { duration: Infinity });
  });
};
