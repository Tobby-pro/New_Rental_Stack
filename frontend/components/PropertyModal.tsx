import React from 'react';

const PropertyModal = ({ isOpen, onClose, properties }: { isOpen: boolean; onClose: () => void; properties: any[] }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-3/4 max-w-4xl">
        <h2 className="text-2xl font-semibold mb-4">My Properties</h2>
        <ul>
          {properties.map((property) => (
            <li key={property.id} className="border-b border-gray-300 mb-2">
              <div className="flex justify-between">
                <div>
                  
                  <p>{property.address}</p>
                  <p>{property.price} Naira</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <button
          onClick={onClose}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default PropertyModal;
