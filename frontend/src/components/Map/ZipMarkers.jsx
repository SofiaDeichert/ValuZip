import { Marker } from 'react-map-gl/mapbox';
import { useNavigate } from 'react-router-dom';
import centroid from '@turf/centroid';

export default function ZipMarkers({ geojson, excludeZip }) {
  const navigate = useNavigate();

  const features = excludeZip
    ? geojson.features.filter(
        (f) => String(f.properties.ZipCode) !== String(excludeZip),
      )
    : geojson.features;

  return features.map((feature) => {
    const zip = feature.properties.ZipCode;
    const center = centroid(feature); // center of zip code boundaries
    const [lng, lat] = center.geometry.coordinates;

    return (
      <Marker key={zip} longitude={lng} latitude={lat}>
        <button
          type="button"
          onClick={() => navigate(`/zip/${zip}`)}
          className="bg-white border-2 border-[#006400] text-[#006400] font-bold text-xs px-2 py-1 rounded-full cursor-pointer shadow-md transition-colors hover:bg-[#006400] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006400]/40 focus-visible:ring-offset-1"
        >
          {zip}
        </button>
      </Marker>
    );
  });
}
