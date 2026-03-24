import { useState } from 'react';
import PropertyForm from '../components/PropertyForm';
import MapView from '../components/Map/MapView';
import ZipSelect from '../components/ZipSelect';

const MapPage = () => {
  const [selectedZip, setSelectedZip] = useState('');

  return (
    <div className="h-full flex flex-col overflow-hidden bg-gray-100 px-8 sm:px-12 lg:px-20 xl:px-28 2xl:px-36 pt-6 pb-6 gap-4">
      <div className="flex flex-1 min-h-0 gap-5 items-stretch">
        <div className="hidden md:block w-1/4 flex-shrink-0">
          <PropertyForm
            selectedZip={selectedZip}
            setSelectedZip={setSelectedZip}
          />
        </div>

        {/* Map container — relative so the overlay sits inside it */}
        <div className="flex-1 min-w-0 rounded-2xl shadow-md overflow-hidden bg-white relative">
          <MapView selectedZip={selectedZip} />
          <div className="absolute top-3 right-3 z-10">
            <ZipSelect style={{ width: 220 }} />
          </div>
        </div>
      </div>

      <div className="md:hidden flex-shrink-0">
        <PropertyForm
          selectedZip={selectedZip}
          setSelectedZip={setSelectedZip}
        />
      </div>
    </div>
  );
};

export default MapPage;
