import { useState, useEffect } from 'react';
import Map from 'react-map-gl/mapbox';
import ZipMarkers from './ZipMarkers';
import geojsonUrl from '../../data/dallas-zips.geojson?url';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

export default function MapView() {
  const [viewState, setViewState] = useState({
    longitude: -96.797,
    latitude: 32.7767,
    zoom: 12,
  });
  const [geojson, setGeojson] = useState(null);

  // fetch GeoJSON on mount
  useEffect(() => {
    fetch(geojsonUrl)
      .then((res) => res.json())
      .then((data) => setGeojson(data));
  }, []);

  return (
    <div className="w-full h-full">
      <Map
        {...viewState}
        onMove={(e) => setViewState(e.viewState)}
        mapStyle="mapbox://styles/mapbox/standard"
        mapboxAccessToken={MAPBOX_TOKEN}
      >
        {geojson && <ZipMarkers geojson={geojson} />}
      </Map>
    </div>
  );
}
