import { useEffect } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function MobileDrawer({ open, onClose, children }: Props) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      {/* Overlay */}
      <div className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300
        ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose} />

      {/* Drawer */}
      <div className={`fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-white z-50 shadow-2xl
        transition-transform duration-300 ease-out overflow-y-auto
        ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
          <span className="font-bold text-gray-800">Parámetros</span>
          <button onClick={onClose}
            className="rounded-lg bg-gray-100 hover:bg-gray-200 w-8 h-8 flex items-center justify-center text-gray-500 cursor-pointer transition-colors">
            ✕
          </button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </>
  );
}
