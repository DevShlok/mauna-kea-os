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
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className={`${t.visible ? 'animate-in zoom-in-95' : 'animate-out zoom-out-95'} neo-card max-w-sm w-full pointer-events-auto flex flex-col p-8`}>
        <div className="w-12 h-12 neo-card-sm flex items-center justify-center mb-5 mx-auto">
          <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
        </div>
        <h3 className="text-lg font-serif font-bold text-[#111] mb-2 text-center">Confirmation Required</h3>
        <p className="text-sm text-gray-500 mb-8 text-center">{message}</p>
        <div className="flex justify-center gap-4">
          <button
            onClick={() => {
              toast.dismiss(t.id);
              resolve(false);
            }}
            className="px-6 py-2.5 neo-btn text-gray-600 text-sm font-bold"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              resolve(true);
            }}
            className="px-6 py-2.5 neo-btn text-sm font-bold"
            style={{ color: '#dc2626', background: '#fff5f5', boxShadow: '5px 5px 12px #f5c6c6, -5px -5px 12px #ffffff' }}
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
