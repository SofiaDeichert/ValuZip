import { Marker } from 'react-map-gl/mapbox';
import { useNavigate } from 'react-router-dom';
import centroid from '@turf/centroid';

export default function ZipMarkers({ geojson }) {
  const navigate = useNavigate();

  return geojson.features.map((feature) => {
    const zip = feature.properties.ZipCode;
    const center = centroid(feature); // center of zip code boundaries
    const [lng, lat] = center.geometry.coordinates;

    return (
      <Marker key={zip} longitude={lng} latitude={lat}>
        <div
          onClick={() => navigate(`/zip/${zip}`)}
          className="bg-blue-50 border-2 border-blue-500 text-blue-700 font-bold text-xs px-2 py-1 rounded-full cursor-pointer hover:bg-blue-500 hover:text-white transition-colors shadow-md"
        >
          {zip}
        </div>
      </Marker>
    );
  });
}
