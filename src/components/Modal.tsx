import { ReactNode, useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

export default function Modal({ isOpen, onClose, children, footer }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center min-h-screen w-screen" style={{ background: 'radial-gradient(ellipse at center, #26734d 60%, #14532d 100%)' }}>
      {/* Optional vignette overlay for extra depth */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.18) 60%, transparent 100%)' }} />
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full relative z-10 sm:rounded-2xl sm:p-8 sm:max-w-lg sm:max-h-[90vh] sm:overflow-auto w-full h-full max-w-none max-h-none flex flex-col sm:block">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 focus:outline-none"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="flex-1 overflow-y-auto w-full sm:overflow-visible">
          {children}
        </div>
        {/* Sticky footer for mobile */}
        {footer && (
          <div className="block sm:hidden sticky bottom-0 left-0 w-full bg-white pt-4 pb-6 z-20 border-t border-gray-100">{footer}</div>
        )}
      </div>
      <style jsx global>{`
        @keyframes popout {
          0% { opacity: 0; transform: scale(0.95) translateY(20px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-popout {
          animation: popout 0.18s cubic-bezier(0.4,0,0.2,1);
        }
      `}</style>
    </div>
  );
} 