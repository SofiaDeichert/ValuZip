import { useState } from 'react';
import PropertyForm from '../components/PropertyForm';
import MapView from '../components/Map/MapView';

const MapPage = () => {
  const [selectedZip, setSelectedZip] = useState('');

  return (
    <div className="h-full min-h-0 flex flex-col overflow-hidden bg-gray-100">
      <div className="bg-white border-b border-gray-200 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
        <div className="px-4 py-3 sm:px-6">
          <PropertyForm
            selectedZip={selectedZip}
            setSelectedZip={setSelectedZip}
          />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden border-y border-gray-200 bg-white">
        <MapView />
      </div>
    </div>
  );
};

export default MapPage;
