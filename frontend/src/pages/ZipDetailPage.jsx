import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Map, { Source, Layer, Marker } from 'react-map-gl/mapbox';
import centroid from '@turf/centroid';
import geojsonUrl from '../data/dallas-zips.geojson?url';
import ZipMarkers from '../components/Map/ZipMarkers';
import PriceForecastChart from '../components/ZipDetail/PriceForecastChart';
import ZipSelect from '../components/ZipSelect';
import { getZipAnalytics } from '../data/zipAnalytics';
import { parseTimeRangeYears, runPropertyAnalysis } from '../utils/propertyAnalysis';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

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
  if (val == null || !Number.isFinite(val)) return '—';
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
  return `$${val}`;
}

function toPropertyAnalysisForm(selectedFilters, zipFromRoute) {
  return {
    zip: String(selectedFilters?.zip || zipFromRoute || ''),
    bedrooms: selectedFilters?.bedsBaths?.bedrooms ?? '',
    bathrooms: selectedFilters?.bedsBaths?.bathrooms ?? '',
    sqft: '',
    minSqft: selectedFilters?.sqft?.min ?? '',
    maxSqft: selectedFilters?.sqft?.max ?? '',
    minPrice: selectedFilters?.priceRange?.min ?? '',
    maxPrice: selectedFilters?.priceRange?.max ?? '',
    timeRange: selectedFilters?.timeRange || 'Last 3 years',
  };
}

export default function ZipDetailPage() {
  const { zip } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [viewState, setViewState] = useState(null);
  const [geojson, setGeojson] = useState(null);
  const [zipFeature, setZipFeature] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [activeChartModal, setActiveChartModal] = useState(null); // 'homePrice' | 'avgSqft' | null
  const [propertyAnalysis, setPropertyAnalysis] = useState({
    loading: false,
    result: null,
    error: null,
  });
  const [zipAnalytics, setZipAnalytics] = useState({
    city: '',
    state: '',
    medianHomePrice: null,
    avgPricePerSqft: null,
    lastUpdated: '--/--/----',
    homePriceHistorical: [],
    homePriceForecast: [],
    sqftHistorical: [],
    sqftForecast: [],
  });
  const analysisContext = location.state?.analysisContext;
  const selectedFilters = analysisContext?.selectedFilters ?? null;
  const isAnalyzePropertyFlow =
    analysisContext?.entryPoint === 'analyze-property' && Boolean(selectedFilters);
  const selectedTimeRangeYears =
    isAnalyzePropertyFlow && selectedFilters?.timeRange
      ? parseTimeRangeYears(selectedFilters.timeRange)
      : null;

  useEffect(() => {
    if (!activeChartModal) return;

    const onKeyDown = (e) => {
      if (e.key === 'Escape') setActiveChartModal(null);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeChartModal]);

  useEffect(() => {
    if (!activeChartModal) return;
    if (typeof document === 'undefined') return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [activeChartModal]);

  useEffect(() => {
    fetch(geojsonUrl)
      .then((r) => r.json())
      .then((data) => setGeojson(data));
  }, []);

  useEffect(() => {
    if (!geojson) return;
    const feature = geojson.features.find(
      (f) => String(f.properties.ZipCode) === String(zip),
    );
    if (feature) {
      setZipFeature(feature);
      const c = centroid(feature);
      const [lng, lat] = c.geometry.coordinates;
      setViewState({ longitude: lng, latitude: lat, zoom: 12.5 });
    } else {
      setZipFeature(null);
    }
  }, [zip, geojson]);

  useEffect(() => {
    let alive = true;
    const analyticsOptions =
      Number.isFinite(selectedTimeRangeYears) && selectedTimeRangeYears > 0
        ? { timeRangeYears: selectedTimeRangeYears }
        : undefined;

    getZipAnalytics(zip, analyticsOptions).then((data) => {
      if (!alive) return;
      setZipAnalytics(data);
    });
    return () => {
      alive = false;
    };
  }, [zip, selectedTimeRangeYears]);

  useEffect(() => {
    let alive = true;
    if (!isAnalyzePropertyFlow) {
      setPropertyAnalysis({ loading: false, result: null, error: null });
      return;
    }

    setPropertyAnalysis({ loading: true, result: null, error: null });
    const form = toPropertyAnalysisForm(selectedFilters, zip);

    runPropertyAnalysis(form)
      .then((analysis) => {
        if (!alive) return;
        if (analysis.ok) {
          setPropertyAnalysis({ loading: false, result: analysis, error: null });
        } else {
          setPropertyAnalysis({
            loading: false,
            result: null,
            error: analysis.message || 'Could not compute property analysis.',
          });
        }
      })
      .catch(() => {
        if (!alive) return;
        setPropertyAnalysis({
          loading: false,
          result: null,
          error: 'Could not compute property analysis.',
        });
      });

    return () => {
      alive = false;
    };
  }, [isAnalyzePropertyFlow, selectedFilters, zip]);

  const highlightGeojson = zipFeature
    ? { type: 'FeatureCollection', features: [zipFeature] }
    : null;

  const markerCenter = zipFeature
    ? centroid(zipFeature).geometry.coordinates
    : null;

  const cityStateText = [zipAnalytics.city, zipAnalytics.state].filter(Boolean).join(', ');

  const propertyAnalysisResult =
    isAnalyzePropertyFlow && propertyAnalysis.result?.ok ? propertyAnalysis.result : null;

  const displayMedianHomePrice = (() => {
    if (!isAnalyzePropertyFlow) return zipAnalytics.medianHomePrice;
    if (propertyAnalysis.loading) return null;
    if (propertyAnalysis.error) return null;
    if (!propertyAnalysisResult) return null;
    return (
      propertyAnalysisResult.medianSalePrice ??
      propertyAnalysisResult.zipMedianHomePrice ??
      propertyAnalysisResult.estimatedPoint ??
      null
    );
  })();

  const displayAvgPricePerSqft = (() => {
    if (!isAnalyzePropertyFlow) return zipAnalytics.avgPricePerSqft;
    if (propertyAnalysis.loading) return null;
    if (propertyAnalysis.error) return null;
    if (
      propertyAnalysisResult?.avgPricePerSqft == null ||
      !Number.isFinite(propertyAnalysisResult.avgPricePerSqft)
    ) {
      return null;
    }
    return Math.round(propertyAnalysisResult.avgPricePerSqft);
  })();

  const homeDataContextText = (() => {
    if (isAnalyzePropertyFlow && propertyAnalysis.loading) return 'Loading analysis…';
    if (isAnalyzePropertyFlow && propertyAnalysis.error) return propertyAnalysis.error;
    if (isAnalyzePropertyFlow && propertyAnalysisResult?.note) return propertyAnalysisResult.note;
    return zipAnalytics.homePriceHistorical.length
      ? 'Based on recorded monthly sales data'
      : 'Historical data unavailable';
  })();

  const sqftDataContextText = (() => {
    if (isAnalyzePropertyFlow && propertyAnalysis.loading) return 'Loading analysis…';
    if (isAnalyzePropertyFlow && propertyAnalysis.error) return propertyAnalysis.error;
    if (isAnalyzePropertyFlow && propertyAnalysisResult?.note) return propertyAnalysisResult.note;
    return zipAnalytics.sqftHistorical.length
      ? 'Based on recorded monthly sales data'
      : 'Historical data unavailable';
  })();

  const modalTitle =
    activeChartModal === 'homePrice'
      ? 'Median Home Price'
      : activeChartModal === 'avgSqft'
        ? 'Avg. Price / Sq Ft'
        : '';

  return (
    <div className="h-full min-h-0 flex flex-col overflow-hidden bg-gray-100">
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden bg-white border-y border-gray-200">
        {/* LEFT: map surface (full-canvas), relative so overlays position inside it */}
        <div className="w-full lg:w-[65%] min-w-0 min-h-0 relative overflow-hidden bg-white">
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
                    paint={{ 'fill-color': '#006400', 'fill-opacity': 0.18 }}
                  />
                  <Layer
                    id="zip-border"
                    type="line"
                    paint={{ 'line-color': '#006400', 'line-width': 2.5 }}
                  />
                </Source>
              )}
              {geojson && (
                <ZipMarkers geojson={geojson} excludeZip={zip} />
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
                      <div className="w-7 h-7 rounded-full bg-[#006400]/10 flex items-center justify-center flex-shrink-0">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 14 14"
                          fill="none"
                        >
                          <path
                            d="M7 1C4.79 1 3 2.79 3 5C3 8 7 13 7 13C7 13 11 8 11 5C11 2.79 9.21 1 7 1ZM7 6.5C6.17 6.5 5.5 5.83 5.5 5C5.5 4.17 6.17 3.5 7 3.5C7.83 3.5 8.5 4.17 8.5 5C8.5 5.83 7.83 6.5 7 6.5Z"
                            fill="#006400"
                          />
                        </svg>
                      </div>
                      <div>
                        <div className="text-base font-bold text-gray-900 leading-tight">
                          {zip}
                        </div>
                        <div className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                          {cityStateText || '—'}
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

        {/* RIGHT: docked sidebar */}
        <aside className="w-full lg:w-[35%] flex-shrink-0 min-h-0 bg-white border-t lg:border-t-0 lg:border-l border-gray-200 overflow-y-auto p-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col gap-5 min-h-0">
            <div>
              <p className="text-2xl font-bold text-gray-900 mt-0 mb-0">
                {zip} · {cityStateText || '—'}
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
                  <div className="w-8 h-8 rounded-lg bg-[#006400]/8 flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M1 6.5L8 1L15 6.5V15H10V10H6V15H1V6.5Z"
                        stroke="#006400"
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
                {formatPrice(displayMedianHomePrice)}
              </div>
              <div className="mt-1 text-sm text-gray-600">
                {homeDataContextText}
              </div>
              <div className="text-sm text-gray-400 mb-5">
                Last updated: {zipAnalytics.lastUpdated}
              </div>
              <PriceForecastChart
                historicalData={zipAnalytics.homePriceHistorical}
                forecastData={zipAnalytics.homePriceForecast}
                color="#006400"
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
                {displayAvgPricePerSqft == null ? '—' : `$${displayAvgPricePerSqft}`}
              </div>
              <div className="mt-1 text-sm text-gray-600">
                {sqftDataContextText}
              </div>
              <div className="text-xs text-gray-400 mb-5">
                Last updated: {zipAnalytics.lastUpdated}
              </div>
              <PriceForecastChart
                historicalData={zipAnalytics.sqftHistorical}
                forecastData={zipAnalytics.sqftForecast}
                color="#2563eb"
                xAxisLabel="Date"
                yAxisLabel="USD / sq ft"
                yAxisFormatter={sqftTickFmt}
                tooltipFormatter={sqftTooltipFmt}
              />
            </div>
          </div>
        </aside>

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
                    ZIP Code {zip} · {cityStateText || '—'} · Last updated{' '}
                    {zipAnalytics.lastUpdated}
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
                      historicalData={zipAnalytics.homePriceHistorical}
                      forecastData={zipAnalytics.homePriceForecast}
                      color="#006400"
                      xAxisLabel="Date"
                      yAxisLabel="Price (USD)"
                      yAxisFormatter={homePriceTickFmt}
                      tooltipFormatter={homePriceTooltipFmt}
                    />
                  )}
                  {activeChartModal === 'avgSqft' && (
                    <PriceForecastChart
                      historicalData={zipAnalytics.sqftHistorical}
                      forecastData={zipAnalytics.sqftForecast}
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
