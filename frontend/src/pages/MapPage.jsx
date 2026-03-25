import { useState } from 'react';
import PropertyForm from '../components/PropertyForm';
import MapView from '../components/Map/MapView';
import ZipSelect from '../components/ZipSelect';

const MapPage = () => {
  const [selectedZip, setSelectedZip] = useState('');

  return (
    <div className="h-full min-h-0 flex flex-col overflow-hidden bg-gray-100 px-2 sm:px-3 lg:px-4 py-2 sm:py-3">
      <div className="flex-1 min-h-0 flex overflow-hidden bg-white border border-gray-200 rounded-xl">
        {/* Docked sidebar (desktop) */}
        <aside className="hidden md:flex w-[380px] lg:w-[400px] flex-shrink-0 min-h-0 flex-col bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-6">
            <PropertyForm
              selectedZip={selectedZip}
              setSelectedZip={setSelectedZip}
            />
          </div>
        </aside>

        {/* Map surface — dominant + immersive */}
        <section className="flex-1 min-w-0 min-h-0 relative overflow-hidden bg-white">
          <MapView selectedZip={selectedZip} />
          <div className="absolute top-3 right-3 z-10">
            <ZipSelect style={{ width: 220 }} />
          </div>
        </section>
      </div>

      {/* Mobile: form docks as a clean section (no floating-card look) */}
      <div className="md:hidden mt-3 bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="p-5">
          <PropertyForm
            selectedZip={selectedZip}
            setSelectedZip={setSelectedZip}
          />
        </div>
      </div>
    </div>
  );
};

export default MapPage;
