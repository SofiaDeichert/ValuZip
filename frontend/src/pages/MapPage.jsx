import { useState } from 'react';
import PropertyForm from '../components/PropertyForm';
import MapView from '../components/Map/MapView';
import ZipSelect from '../components/ZipSelect';

const MapPage = () => {
  const [selectedZip, setSelectedZip] = useState('');

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        backgroundColor: '#f3f4f6',
      }}
    >
      {/* ── Top bar: page title + ZIP search ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 24px 0 24px',
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 700,
              color: '#111827',
            }}
          >
            Dallas Property Map
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#6b7280' }}>
            Click a ZIP on the map or search to view neighborhood stats.
          </p>
        </div>

        <ZipSelect style={{ width: 220 }} />
      </div>

      {/* ── Form + Map ── */}
      <div
        style={{
          display: 'flex',
          gap: '24px',
          padding: '20px 24px 24px 24px',
        }}
      >
        <div
          style={{
            width: '360px',
            flexShrink: 0,
          }}
        >
          <PropertyForm
            selectedZip={selectedZip}
            setSelectedZip={setSelectedZip}
          />
        </div>

        <div
          style={{
            flex: 1,
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
            overflow: 'hidden',
            minHeight: '700px',
          }}
        >
          <MapView selectedZip={selectedZip} />
        </div>
      </div>
    </div>
  );
};

export default MapPage;
