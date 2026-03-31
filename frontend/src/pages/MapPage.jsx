import { useState } from 'react';
import PropertyForm from '../components/PropertyForm';
import MapView from '../components/Map/MapView';

const MapPage = () => {
  const [selectedZip, setSelectedZip] = useState('');
  const zip = String(selectedZip || '').trim();
  const contextLine = zip
    ? `Showing results for ZIP ${zip}`
    : 'Showing results based on your selected filters';

  return (
    <div className="h-full min-h-0 flex flex-col overflow-hidden bg-gray-100">
      <div className="bg-white border-b border-gray-200 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
        <div className="px-4 py-3 sm:px-6 sm:py-3.5">
          <PropertyForm
            selectedZip={selectedZip}
            setSelectedZip={setSelectedZip}
          />
          <p
            className="mt-2 max-w-4xl text-xs leading-snug text-gray-500 sm:text-[13px]"
            aria-live="polite"
          >
            {contextLine}
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden bg-white">
        <MapView />
      </div>
    </div>
  );
};

export default MapPage;
