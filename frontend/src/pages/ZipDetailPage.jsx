import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Map, { Source, Layer } from 'react-map-gl/mapbox';
import { Marker } from 'react-map-gl/mapbox';
import centroid from '@turf/centroid';
import geojsonUrl from '../data/dallas-zips.geojson?url';
import PriceForecastChart from '../components/ZipDetail/PriceForecastChart';
import ZipSelect from '../components/ZipSelect';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const MOCK_STATS = {
  medianHomePrice: 565000,
  avgPricePerSqft: 312,
  lastUpdated: '03/23/2026',
};

const HOME_PRICE_HISTORICAL = [
  { date: 'Mar 2024', value: 495000 },
  { date: 'Apr 2024', value: 502000 },
  { date: 'May 2024', value: 510000 },
  { date: 'Jun 2024', value: 518000 },
  { date: 'Jul 2024', value: 525000 },
  { date: 'Aug 2024', value: 530000 },
  { date: 'Sep 2024', value: 534000 },
  { date: 'Oct 2024', value: 538000 },
  { date: 'Nov 2024', value: 542000 },
  { date: 'Dec 2024', value: 548000 },
  { date: 'Jan 2025', value: 553000 },
  { date: 'Feb 2025', value: 558000 },
  { date: 'Mar 2025', value: 565000 },
];

const HOME_PRICE_FORECAST = [
  { date: 'Apr 2025', value: 570000 },
  { date: 'May 2025', value: 576000 },
  { date: 'Jun 2025', value: 582000 },
  { date: 'Jul 2025', value: 589000 },
  { date: 'Aug 2025', value: 595000 },
  { date: 'Sep 2025', value: 601000 },
  { date: 'Oct 2025', value: 607000 },
  { date: 'Nov 2025', value: 612000 },
  { date: 'Dec 2025', value: 618000 },
  { date: 'Jan 2026', value: 623000 },
  { date: 'Feb 2026', value: 629000 },
  { date: 'Mar 2026', value: 634000 },
];

const SQFT_HISTORICAL = [
  { date: 'Mar 2024', value: 274 },
  { date: 'Apr 2024', value: 278 },
  { date: 'May 2024', value: 281 },
  { date: 'Jun 2024', value: 285 },
  { date: 'Jul 2024', value: 288 },
  { date: 'Aug 2024', value: 291 },
  { date: 'Sep 2024', value: 294 },
  { date: 'Oct 2024', value: 296 },
  { date: 'Nov 2024', value: 299 },
  { date: 'Dec 2024', value: 303 },
  { date: 'Jan 2025', value: 306 },
  { date: 'Feb 2025', value: 309 },
  { date: 'Mar 2025', value: 312 },
];

const SQFT_FORECAST = [
  { date: 'Apr 2025', value: 315 },
  { date: 'May 2025', value: 318 },
  { date: 'Jun 2025', value: 321 },
  { date: 'Jul 2025', value: 324 },
  { date: 'Aug 2025', value: 327 },
  { date: 'Sep 2025', value: 330 },
  { date: 'Oct 2025', value: 333 },
  { date: 'Nov 2025', value: 336 },
  { date: 'Dec 2025', value: 339 },
  { date: 'Jan 2026', value: 341 },
  { date: 'Feb 2026', value: 344 },
  { date: 'Mar 2026', value: 347 },
];

const homePriceTickFmt = (v) => {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return `${v}`;
};
const homePriceTooltipFmt = (v) => {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v}`;
};
const sqftTickFmt = (v) => `${v}`;
const sqftTooltipFmt = (v) => `$${v}/sqft`;

function formatPrice(val) {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
  return `$${val}`;
}

export default function ZipDetailPage() {
  const { zip } = useParams();
  const navigate = useNavigate();
  const [viewState, setViewState] = useState(null);
  const [zipFeature, setZipFeature] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [activeChartModal, setActiveChartModal] = useState(null); // 'homePrice' | 'avgSqft' | null

  useEffect(() => {
    if (!activeChartModal) return;

    const onKeyDown = (e) => {
      if (e.key === 'Escape') setActiveChartModal(null);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeChartModal]);

  useEffect(() => {
    fetch(geojsonUrl)
      .then((r) => r.json())
      .then((data) => {
        const feature = data.features.find(
          (f) => String(f.properties.ZipCode) === String(zip),
        );
        if (feature) {
          setZipFeature(feature);
          const center = centroid(feature);
          const [lng, lat] = center.geometry.coordinates;
          setViewState({ longitude: lng, latitude: lat, zoom: 12.5 });
        }
      });
  }, [zip]);

  const highlightGeojson = zipFeature
    ? { type: 'FeatureCollection', features: [zipFeature] }
    : null;

  const markerCenter = zipFeature
    ? centroid(zipFeature).geometry.coordinates
    : null;

  const modalTitle =
    activeChartModal === 'homePrice'
      ? 'Median Home Price'
      : activeChartModal === 'avgSqft'
        ? 'Avg. Price / Sq Ft'
        : '';

  return (
    <div className="h-full flex flex-col overflow-hidden bg-gray-50 px-8 sm:px-12 lg:px-20 xl:px-28 2xl:px-36 pt-6 pb-6 gap-5">
      <div className="flex flex-1 min-h-0 gap-6 items-stretch">
        {/* LEFT: map, relative so overlays position inside it */}
        <div className="hidden lg:block w-2/3 flex-shrink-0 h-full rounded-2xl overflow-hidden shadow-md relative">
          {viewState && (
            <Map
              {...viewState}
              onMove={(e) => setViewState(e.viewState)}
              onLoad={() => setMapLoaded(true)}
              mapStyle="mapbox://styles/mapbox/standard"
              mapboxAccessToken={MAPBOX_TOKEN}
              style={{ width: '100%', height: '100%' }}
              projection="mercator"
            >
              {mapLoaded && highlightGeojson && (
                <Source
                  id="zip-highlight"
                  type="geojson"
                  data={highlightGeojson}
                >
                  <Layer
                    id="zip-fill"
                    type="fill"
                    paint={{ 'fill-color': '#16a34a', 'fill-opacity': 0.18 }}
                  />
                  <Layer
                    id="zip-border"
                    type="line"
                    paint={{ 'line-color': '#15803d', 'line-width': 2.5 }}
                  />
                </Source>
              )}
              {markerCenter && (
                <Marker
                  longitude={markerCenter[0]}
                  latitude={markerCenter[1]}
                  anchor="bottom"
                >
                  <div className="flex flex-col items-center">
                    <div
                      className="bg-white rounded-xl shadow-xl px-4 py-2.5 flex items-center gap-2.5 border border-gray-100"
                      style={{ minWidth: '130px' }}
                    >
                      <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 14 14"
                          fill="none"
                        >
                          <path
                            d="M7 1C4.79 1 3 2.79 3 5C3 8 7 13 7 13C7 13 11 8 11 5C11 2.79 9.21 1 7 1ZM7 6.5C6.17 6.5 5.5 5.83 5.5 5C5.5 4.17 6.17 3.5 7 3.5C7.83 3.5 8.5 4.17 8.5 5C8.5 5.83 7.83 6.5 7 6.5Z"
                            fill="#16a34a"
                          />
                        </svg>
                      </div>
                      <div>
                        <div className="text-base font-bold text-gray-900 leading-tight">
                          {zip}
                        </div>
                        <div className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                          Dallas, TX
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        width: 0,
                        height: 0,
                        borderLeft: '8px solid transparent',
                        borderRight: '8px solid transparent',
                        borderTop: '8px solid white',
                        filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.10))',
                      }}
                    />
                  </div>
                </Marker>
              )}
            </Map>
          )}

          {/* Back to map — top left overlay */}
          <button
            onClick={() => navigate('/')}
            className="absolute top-3 left-3 z-10 flex items-center gap-2 text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors px-3 py-2 rounded-lg shadow-md border border-gray-200"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M10 3L5 8L10 13"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back to map
          </button>

          {/* ZIP search — top right overlay */}
          <div className="absolute top-3 right-3 z-10">
            <ZipSelect currentZip={zip} style={{ width: 220 }} />
          </div>
        </div>

        {/* RIGHT: single card panel*/}
        <div className="flex-1 lg:flex-none lg:w-1/3 h-full bg-white rounded-2xl shadow-md border border-gray-100 overflow-y-auto min-h-0 flex flex-col justify-start">
          <div className="px-6 py-6 flex flex-col gap-5">
            <div className="pl-3">
              
            <p className="text-2xl font-bold text-gray-900 mt-2 mb-3">
  {zip} · Dallas, TX
</p>
                
              
            </div>

            <div
              className="bg-gray-50 rounded-xl p-5 border border-gray-100 cursor-pointer transition-all duration-200 hover:shadow-sm hover:border-gray-200 hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-50"
              role="button"
              tabIndex={0}
              onClick={() => setActiveChartModal('homePrice')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setActiveChartModal('homePrice');
                }
              }}
              aria-label="Open median home price chart in modal"
            >
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M1 6.5L8 1L15 6.5V15H10V10H6V15H1V6.5Z"
                        stroke="#16a34a"
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <span className="text-md font-semibold text-gray-400 uppercase tracking-wide truncate">
                    Median Home Price
                  </span>
                </div>
                <span className="text-xs font-medium text-gray-400 whitespace-nowrap">
                  Click to expand
                </span>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {formatPrice(MOCK_STATS.medianHomePrice)}
              </div>
              <div className="text-sm text-gray-400 mb-5">
                Last updated: {MOCK_STATS.lastUpdated}
              </div>
              <PriceForecastChart
                historicalData={HOME_PRICE_HISTORICAL}
                forecastData={HOME_PRICE_FORECAST}
                color="#16a34a"
                xAxisLabel="Date"
                yAxisLabel="Price (USD)"
                yAxisFormatter={homePriceTickFmt}
                tooltipFormatter={homePriceTooltipFmt}
              />
            </div>

            <div
              className="bg-gray-50 rounded-xl p-5 border border-gray-100 cursor-pointer transition-all duration-200 hover:shadow-sm hover:border-gray-200 hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-50"
              role="button"
              tabIndex={0}
              onClick={() => setActiveChartModal('avgSqft')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setActiveChartModal('avgSqft');
                }
              }}
              aria-label="Open average price per square foot chart in modal"
            >
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <rect
                        x="1"
                        y="1"
                        width="14"
                        height="14"
                        rx="2"
                        stroke="#2563eb"
                        strokeWidth="1.5"
                      />
                      <path
                        d="M4 12L12 4M4 4H7M4 4V7"
                        stroke="#2563eb"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <span className="text-md font-semibold text-gray-400 uppercase tracking-wide truncate">
                    Avg. Price / Sq Ft
                  </span>
                </div>
                <span className="text-xs font-medium text-gray-400 whitespace-nowrap">
                  Click to expand
                </span>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                ${MOCK_STATS.avgPricePerSqft}
              </div>
              <div className="text-xs text-gray-400 mb-5">
                Last updated: {MOCK_STATS.lastUpdated}
              </div>
              <PriceForecastChart
                historicalData={SQFT_HISTORICAL}
                forecastData={SQFT_FORECAST}
                color="#2563eb"
                xAxisLabel="Date"
                yAxisLabel="USD / sq ft"
                yAxisFormatter={sqftTickFmt}
                tooltipFormatter={sqftTooltipFmt}
              />
            </div>
          </div>
        </div>

        {/* Modal overlay */}
        {activeChartModal && (
          <div
            className="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-6"
            onMouseDown={(e) => {
              // Close only when the overlay itself is clicked.
              if (e.target === e.currentTarget) setActiveChartModal(null);
            }}
          >
            <div
              className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
              role="dialog"
              aria-modal="true"
              aria-label={`${modalTitle} chart modal`}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 leading-tight">{modalTitle}</h3>
                  <p className="text-sm text-gray-500">
                    ZIP Code {zip} · Dallas, TX · Last updated {MOCK_STATS.lastUpdated}
                  </p>
                </div>
                <button
                  type="button"
                  className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => setActiveChartModal(null)}
                  aria-label="Close modal"
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                    <path
                      d="M4.5 4.5L13.5 13.5M13.5 4.5L4.5 13.5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>

              <div className="p-6 overflow-y-auto">
                <div className="w-full">
                  {activeChartModal === 'homePrice' && (
                    <PriceForecastChart
                      historicalData={HOME_PRICE_HISTORICAL}
                      forecastData={HOME_PRICE_FORECAST}
                      color="#16a34a"
                      xAxisLabel="Date"
                      yAxisLabel="Price (USD)"
                      yAxisFormatter={homePriceTickFmt}
                      tooltipFormatter={homePriceTooltipFmt}
                    />
                  )}
                  {activeChartModal === 'avgSqft' && (
                    <PriceForecastChart
                      historicalData={SQFT_HISTORICAL}
                      forecastData={SQFT_FORECAST}
                      color="#2563eb"
                      xAxisLabel="Date"
                      yAxisLabel="USD / sq ft"
                      yAxisFormatter={sqftTickFmt}
                      tooltipFormatter={sqftTooltipFmt}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
