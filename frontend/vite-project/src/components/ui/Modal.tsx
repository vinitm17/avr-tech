// components/Modal.tsx
import React from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 overflow-auto py-10">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative my-auto mx-4 md:mx-auto max-h-[90vh] overflow-auto">
        <button onClick={onClose} className="absolute top-3 right-3 text-black-40 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
        {title && <h2 className="text-xl text-black font-semibold mb-4">{title}</h2>}
        {children}
      </div>
    </div>
  );
}
