import React from 'react';

  interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
  }

  const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-white p-4 rounded-lg">
          {children}
          <button onClick={onClose} className="mt-2 bg-red-600 text-white p-2 rounded">
            Close
          </button>
        </div>
      </div>
    );
  };

  export default Modal;