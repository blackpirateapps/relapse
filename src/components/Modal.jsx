import React from 'react';

function Modal({ isOpen, onClose, title, children }) {
  // This is the most important part of the fix:
  // If the modal is not supposed to be open, it renders nothing at all.
  if (!isOpen) {
    return null;
  }

  // This function stops clicks inside the modal content from closing the modal.
  const handleModalContentClick = (e) => {
    e.stopPropagation();
  };

  return (
    // The dark overlay that covers the screen. Clicking it calls the onClose function.
    <div 
      onClick={onClose} 
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50 transition-opacity duration-300"
    >
      {/* The main modal container */}
      <div 
        onClick={handleModalContentClick} 
        className="bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-gray-700 animate-fade-in"
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-white">{title}</h3>
            {/* The 'X' button to close the modal */}
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-white text-3xl leading-none font-bold transition-colors"
              aria-label="Close modal"
            >
              &times;
            </button>
          </div>
          <div className="text-gray-300">
            {/* This is where the modal's content (passed from HomePage) will be displayed */}
            {children}
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

export default Modal;