import { useEffect } from 'react';

export function Modal({ children, onClose }) {
  useEffect(() => {
    const htmlOriginal = document.documentElement.style.overflow;
    const bodyOriginal = document.body.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = htmlOriginal;
      document.body.style.overflow = bodyOriginal;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-contain p-4"
      role="dialog"
    >
      <button
        type="button"
        className="absolute inset-0 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Close modal"
      />
      <div
        className="relative z-10 my-auto w-full max-w-xl"
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
