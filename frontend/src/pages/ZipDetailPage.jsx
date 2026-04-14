import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback, memo } from 'react';
import Map, { Source, Layer, Marker } from 'react-map-gl/mapbox';
import centroid from '@turf/centroid';
import * as echarts from 'echarts';
import geojsonUrl from '../data/dallas-zips.geojson?url';
import ZipMarkers from '../components/Map/ZipMarkers';
import ZipSelect from '../components/ZipSelect';
import { getZipAnalytics } from '../data/zipAnalytics';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const HISTORY_OPTIONS = [
  { label: '3yr', years: 3 },
  { label: '5yr', years: 5 },
  { label: '10yr', years: 10 },
];
const FORECAST_OPTIONS = [
  { label: '1yr', years: 1 },
  { label: '2yr', years: 2 },
  { label: '3yr', years: 3 },
];
const DEFAULT_HISTORY_YEARS = 3;
const DEFAULT_FORECAST_YEARS = 1;

// ── Formatters ─────────────────────────────────────────────────────────────
const priceTick = (v) => {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return `${v}`;
};
const priceTooltip = (v) => {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v}`;
};
function formatPrice(val) {
  if (val == null || !Number.isFinite(val)) return '—';
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
  return `$${val}`;
}

/**
 * Given a history array of { date: 'Mon YYYY', value } points, returns how
 * many years of data are actually covered (oldest point → today).
 */
function getHistorySpanYears(history) {
  if (!history || history.length === 0) return 0;
  const oldest = history[0].date; // e.g. 'Jan 2019'
  const parsed = new Date(oldest);
  if (isNaN(parsed)) return 0;
  return (Date.now() - parsed.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
}

// ── Toggle component ────────────────────────────────────────────────────────
function Toggle({ options, value, onChange, label, insufficientYears }) {
  return (
    <div
      className="flex items-center gap-2"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      {label && (
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">
          {label}
        </span>
      )}
      <div className="flex items-center gap-0.5 bg-gray-100 rounded-full p-0.5">
        {options.map(({ label: optLabel, years }) => {
          // insufficientYears: null = still loading (don't flag yet).
          // A toggle is disabled if we know the span and it's less than what
          // this button requests. span=0 means no data at all → all disabled.
          const known = insufficientYears != null;
          const isDisabled = known && years > insufficientYears;
          const allUnavailable = known && insufficientYears === 0;
          const isSelected = value === years && !isDisabled;

          const tooltipText = allUnavailable
            ? 'No historical data available'
            : 'Not enough data for this window';

          return (
            <div key={years} className="relative group">
              <button
                type="button"
                disabled={isDisabled}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isDisabled) onChange(years);
                }}
                className={
                  isSelected
                    ? 'px-3 py-1 rounded-full text-xs font-semibold bg-gray-900 text-white transition-colors'
                    : isDisabled
                      ? 'px-3 py-1 rounded-full text-xs font-semibold text-gray-300 cursor-not-allowed opacity-60'
                      : 'px-3 py-1 rounded-full text-xs font-semibold text-gray-400 hover:text-gray-700 transition-colors'
                }
              >
                {optLabel}
              </button>

              {/* Tooltip — only shown on hover for unavailable options */}
              {isDisabled && (
                <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 hidden group-hover:block">
                  <div className="bg-gray-900 text-white text-[11px] rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-lg leading-snug">
                    {tooltipText}
                  </div>
                  <div className="w-0 h-0 mx-auto border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── ECharts wrapper ─────────────────────────────────────────────────────────
const LineChart = memo(function LineChart({
  historicalData = [],
  forecastData = [],
  color,
  forecastColor,
  yFormatter,
  tooltipFormatter,
  height = 220,
}) {
  const ref = useRef(null);
  const inst = useRef(null);
  const fmt = tooltipFormatter || yFormatter;
  const hasForecast = forecastData.some((d) => Number.isFinite(d?.value));

  useEffect(() => {
    if (!ref.current) return;
    inst.current = echarts.init(ref.current, null, { renderer: 'svg' });
    return () => inst.current?.dispose();
  }, []);

  useEffect(() => {
    if (!inst.current) return;

    const histDates = historicalData.map((d) => d.date);
    const fcDates = hasForecast ? forecastData.map((d) => d.date) : [];
    const allDates = [...histDates, ...fcDates];
    const bridgeIdx = histDates.length - 1;

    const hasHistory = historicalData.length > 0;

    const actualSeries = [
      ...historicalData.map((d) => d.value),
      ...fcDates.map(() => null),
    ];

    // When there IS history: pad nulls so forecast starts at the last
    // historical point (bridge), creating a visual handoff.
    // When there is NO history: start the forecast at index 0 — no gap.
    const forecastSeries = hasForecast
      ? hasHistory
        ? [
            ...histDates.slice(0, -1).map(() => null),
            historicalData.at(-1)?.value ?? null,
            ...forecastData.map((d) => d.value),
          ]
        : forecastData.map((d) => d.value)
      : [];

    inst.current.setOption(
      {
        animation: true,
        animationDuration: 500,
        animationEasing: 'cubicInOut',
        backgroundColor: 'transparent',
        grid: { top: 16, right: 16, bottom: 48, left: 44, containLabel: true },
        tooltip: {
          trigger: 'axis',
          backgroundColor: '#fff',
          borderColor: '#e5e7eb',
          borderWidth: 1,
          textStyle: { color: '#111827', fontSize: 12, fontFamily: 'inherit' },
          formatter(params) {
            const visible = params.filter((p) => {
              if (p.value == null) return false;
              if (
                hasForecast &&
                p.seriesName === 'Historical' &&
                p.dataIndex === bridgeIdx
              )
                return false;
              return true;
            });
            if (!visible.length) return '';
            const rows = visible.map((p) => {
              const isFc = p.seriesName === 'Forecast';
              const dot = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${isFc ? forecastColor : color};opacity:${isFc ? 0.7 : 1};margin-right:6px;"></span>`;
              return `${dot}<b>${p.seriesName}</b>: ${fmt(p.value)}`;
            });
            return `<div style="font-size:12px;padding:2px 4px"><div style="color:#6b7280;margin-bottom:3px">${params[0].axisValue}</div>${rows.join('<br/>')}</div>`;
          },
        },
        xAxis: {
          type: 'category',
          data: allDates,
          boundaryGap: false,
          axisLine: { lineStyle: { color: '#e5e7eb' } },
          axisTick: { show: false },
          axisLabel: {
            fontSize: 11,
            color: '#9ca3af',
            interval: Math.max(0, Math.floor(allDates.length / 5) - 1),
          },
        },
        yAxis: {
          type: 'value',
          axisLabel: { fontSize: 11, color: '#9ca3af', formatter: yFormatter },
          splitLine: { lineStyle: { color: '#f3f4f6', type: 'dashed' } },
          axisLine: { show: false },
          axisTick: { show: false },
        },
        series: [
          {
            name: 'Historical',
            type: 'line',
            data: actualSeries,
            connectNulls: false,
            smooth: true,
            symbol: 'none',
            lineStyle: { color, width: 2.5 },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: color + '28' },
                { offset: 1, color: color + '00' },
              ]),
            },
          },
          ...(hasForecast
            ? [
                {
                  name: 'Forecast',
                  type: 'line',
                  data: forecastSeries,
                  connectNulls: false,
                  smooth: true,
                  symbol: 'none',
                  lineStyle: {
                    color: forecastColor || color,
                    width: 2.5,
                    type: 'dashed',
                    opacity: 0.7,
                  },
                  areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                      { offset: 0, color: (forecastColor || color) + '18' },
                      { offset: 1, color: (forecastColor || color) + '00' },
                    ]),
                  },
                },
              ]
            : []),
        ],
      },
      false, // merge (not replace) → enables smooth update animation
    );
  }, [
    historicalData,
    forecastData,
    color,
    forecastColor,
    yFormatter,
    fmt,
    hasForecast,
  ]);

  useEffect(() => {
    const ro = new ResizeObserver(() => inst.current?.resize());
    if (ref.current) ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="w-full">
      <div className="flex items-center gap-4 mb-2">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-0.5 rounded" style={{ background: color }} />
          <span className="text-xs text-gray-400">Historical</span>
        </div>
        {hasForecast && (
          <div className="flex items-center gap-1.5">
            <div
              className="w-5 h-0.5"
              style={{
                background: `repeating-linear-gradient(90deg,${forecastColor || color} 0,${forecastColor || color} 4px,transparent 4px,transparent 7px)`,
                opacity: 0.7,
              }}
            />
            <span className="text-xs text-gray-400">ML Forecast</span>
          </div>
        )}
      </div>
      <div ref={ref} style={{ width: '100%', height }} />
    </div>
  );
});

// ── Chart card ─────────────────────────────────────────────────────────────
// Defined OUTSIDE the page component so it never gets recreated on state
// changes — this keeps the inner LineChart (ECharts) instance alive and
// allows smooth animated data transitions instead of full remounts.
const ChartCard = memo(function ChartCard({
  chartKey,
  icon,
  iconBg,
  title,
  subtitle,
  histNote,
  specPills,
  headerRight,
  value,
  valueLabel,
  historicalData,
  forecastData: fcData,
  color,
  forecastColor,
  isModal = false,
  onExpand,
}) {
  return (
    <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
      {/* Top row: icon + title + expand button */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}
          >
            {icon}
          </div>
          <div className="min-w-0">
            <span className="text-sm font-bold text-gray-700 tracking-tight">
              {title}
            </span>
            <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
          </div>
        </div>
        {!isModal && onExpand && (
          <button
            type="button"
            onClick={() => onExpand(chartKey)}
            className="flex-shrink-0 w-7 h-7 rounded-lg bg-gray-200/70 hover:bg-gray-300/80 flex items-center justify-center transition-colors"
            aria-label="Expand chart"
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path
                d="M7.5 1.5H11.5V5.5"
                stroke="#6b7280"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M11.5 1.5L7 6"
                stroke="#6b7280"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M5.5 11.5H1.5V7.5"
                stroke="#6b7280"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M1.5 11.5L6 7"
                stroke="#6b7280"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Spec pills (property chart only) */}
      {specPills && specPills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {specPills.map((s) => (
            <span
              key={s}
              className="inline-flex items-center rounded-full border border-[#006400]/20 bg-[#006400]/5 px-2.5 py-0.5 text-xs font-semibold text-[#006400]"
            >
              {s}
            </span>
          ))}
        </div>
      )}

      {/* Value */}
      <div className="mb-1">
        <span className="text-3xl font-bold text-gray-900">{value}</span>
      </div>
      {valueLabel && <p className="text-xs text-gray-400 mb-4">{valueLabel}</p>}

      {/* Chart */}
      <LineChart
        historicalData={historicalData}
        forecastData={fcData}
        color={color}
        forecastColor={forecastColor}
        yFormatter={priceTick}
        tooltipFormatter={priceTooltip}
        height={isModal ? 320 : 220}
      />

      {/* Toggles — bottom */}
      {!isModal && headerRight && (
        <div className="mt-4 flex items-center">{headerRight}</div>
      )}

      {/* Historical methodology note */}
      {histNote && (
        <p className="mt-3 text-[11px] text-gray-400 leading-snug">
          {histNote}
        </p>
      )}
    </div>
  );
});

// ── Main page ───────────────────────────────────────────────────────────────
export default function ZipDetailPage() {
  const { zip } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Prediction passed from PropertyForm via router state
  const prediction = location.state?.prediction ?? null;
  const hasPrediction =
    prediction && Number.isFinite(prediction.predictedPrice);

  const [viewState, setViewState] = useState(null);
  const [geojson, setGeojson] = useState(null);
  const [zipFeature, setZipFeature] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'market' | 'property' | null

  // Chart controls
  const [marketHistoryYears, setMarketHistoryYears] = useState(
    DEFAULT_HISTORY_YEARS,
  );
  const [propertyHistoryYears, setPropertyHistoryYears] = useState(
    DEFAULT_HISTORY_YEARS,
  );
  const [forecastYears, setForecastYears] = useState(DEFAULT_FORECAST_YEARS);

  // City/state loaded once on zip change — independent of history toggles
  const [cityState, setCityState] = useState({
    city: '',
    state: '',
    lastUpdated: '--/--/----',
  });

  // Market trend data (zip_median_price time series)
  const [marketAnalytics, setMarketAnalytics] = useState({
    lastUpdated: '--/--/----',
    historical: [],
  });

  // Holds last-good data so charts never receive [] while a fetch is in-flight
  const prevMarketHistorical = useRef([]);
  const prevPropertyHistorical = useRef([]);
  // Property sale data from CSV + forecast from backend
  const [propertyHistorical, setPropertyHistorical] = useState([]);
  const [forecastData, setForecastData] = useState([]);
  const [forecastLoading, setForecastLoading] = useState(false);

  // Oldest data point span in years from the 10yr probe fetch.
  // null = still loading. Used to disable history toggles that exceed available data.
  const [propertyHistorySpanYears, setPropertyHistorySpanYears] =
    useState(null);

  // Modal keyboard / scroll lock
  useEffect(() => {
    if (!activeModal) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setActiveModal(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeModal]);

  useEffect(() => {
    if (!activeModal) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [activeModal]);

  // GeoJSON
  useEffect(() => {
    fetch(geojsonUrl)
      .then((r) => r.json())
      .then(setGeojson);
  }, []);

  // Centre map
  useEffect(() => {
    if (!geojson) return;
    const feature = geojson.features.find(
      (f) => String(f.properties.ZipCode) === String(zip),
    );
    if (feature) {
      setZipFeature(feature);
      const [lng, lat] = centroid(feature).geometry.coordinates;
      setViewState({ longitude: lng, latitude: lat, zoom: 12.5 });
    } else {
      setZipFeature(null);
    }
  }, [zip, geojson]);

  // Load city/state once when zip changes — not affected by history toggles
  useEffect(() => {
    let alive = true;
    getZipAnalytics(zip, { timeRangeYears: 3 }).then((data) => {
      if (!alive) return;
      setCityState({
        city: data.city,
        state: data.state,
        lastUpdated: data.lastUpdated,
      });
    });
    return () => {
      alive = false;
    };
  }, [zip]);

  // Market trend — uses existing getZipAnalytics for zip_median_price series
  // Note: we do NOT clear historical before the fetch resolves so the chart
  // keeps showing the previous data (no empty-array flash) during the load.
  useEffect(() => {
    let alive = true;
    getZipAnalytics(zip, { timeRangeYears: marketHistoryYears }).then(
      (data) => {
        if (!alive) return;
        const hist = data.homePriceHistorical;
        if (hist.length) prevMarketHistorical.current = hist;
        setMarketAnalytics({
          lastUpdated: data.lastUpdated,
          historical: hist.length ? hist : prevMarketHistorical.current,
        });
      },
    );
    return () => {
      alive = false;
    };
  }, [zip, marketHistoryYears]);

  // Property historical — load from backend filtered by zip+beds+baths+sqft±15%
  // Note: we do NOT clear propertyHistorical before the fetch resolves so the
  // chart keeps showing the previous data (no empty-array flash) during load.
  useEffect(() => {
    if (!hasPrediction) {
      setPropertyHistorical([]);
      return;
    }
    let alive = true;
    const { beds, baths, sqft } = prediction;
    fetch(
      `http://127.0.0.1:8000/property-history?zip_code=${zip}&beds=${beds}&baths=${baths}&sqft=${sqft}&years=${propertyHistoryYears}`,
    )
      .then((r) => r.json())
      .then((data) => {
        if (!alive) return;
        const hist = data.history || [];
        if (hist.length) prevPropertyHistorical.current = hist;
        setPropertyHistorical(
          hist.length ? hist : prevPropertyHistorical.current,
        );
      })
      .catch(() => {
        if (alive) setPropertyHistorical(prevPropertyHistorical.current);
      });
    return () => {
      alive = false;
    };
  }, [zip, prediction, propertyHistoryYears, hasPrediction]);

  // Fetch the widest window once to find the oldest data point.
  // spanYears = how far back the data actually goes → disables toggles beyond that.
  useEffect(() => {
    if (!hasPrediction) {
      setPropertyHistorySpanYears(null);
      return;
    }
    let alive = true;
    const { beds, baths, sqft } = prediction;
    fetch(
      `http://127.0.0.1:8000/property-history?zip_code=${zip}&beds=${beds}&baths=${baths}&sqft=${sqft}&years=10`,
    )
      .then((r) => r.json())
      .then((data) => {
        if (!alive) return;
        setPropertyHistorySpanYears(getHistorySpanYears(data.history || []));
      })
      .catch(() => {
        if (alive) setPropertyHistorySpanYears(0);
      });
    return () => {
      alive = false;
    };
  }, [zip, prediction, hasPrediction]);

  // Forecast — fetch from backend when prediction available
  useEffect(() => {
    if (!hasPrediction) {
      setForecastData([]);
      return;
    }
    let alive = true;
    setForecastLoading(true);
    const { beds, baths, sqft } = prediction;
    fetch('http://127.0.0.1:8000/forecast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        zip_code: zip,
        beds,
        baths,
        sqft,
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (!alive) return;
        const all = data.forecast || [];
        setForecastData(all.slice(0, forecastYears * 4));
        setForecastLoading(false);
      })
      .catch(() => {
        if (alive) {
          setForecastData([]);
          setForecastLoading(false);
        }
      });
    return () => {
      alive = false;
    };
  }, [zip, prediction, hasPrediction]);

  // Re-slice forecast when toggle changes (no re-fetch needed)
  const [allForecastData, setAllForecastData] = useState([]);
  useEffect(() => {
    if (!hasPrediction) return;
    fetch('http://127.0.0.1:8000/forecast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        zip_code: zip,
        beds: prediction.beds,
        baths: prediction.baths,
        sqft: prediction.sqft,
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
      }),
    })
      .then((r) => r.json())
      .then((data) => setAllForecastData(data.forecast || []))
      .catch(() => setAllForecastData([]));
  }, [zip, prediction, hasPrediction]);

  const slicedForecast = allForecastData.slice(0, forecastYears * 4);

  const highlightGeojson = zipFeature
    ? { type: 'FeatureCollection', features: [zipFeature] }
    : null;
  const markerCenter = zipFeature
    ? centroid(zipFeature).geometry.coordinates
    : null;
  const cityStateText = [cityState.city, cityState.state]
    .filter(Boolean)
    .join(', ');

  const specPills = hasPrediction
    ? [
        prediction.beds
          ? `${prediction.beds} bed${prediction.beds !== 1 ? 's' : ''}`
          : null,
        prediction.baths
          ? `${prediction.baths} bath${prediction.baths !== 1 ? 's' : ''}`
          : null,
        prediction.sqft
          ? `${Number(prediction.sqft).toLocaleString()} sqft`
          : null,
      ].filter(Boolean)
    : [];

  const handleExpand = useCallback((key) => setActiveModal(key), []);

  const marketLatestPrice = marketAnalytics.historical.at(-1)?.value ?? null;
  const propertyLatestPrice = hasPrediction ? prediction.predictedPrice : null;

  return (
    <div className="h-full min-h-0 flex flex-col overflow-hidden bg-gray-100">
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden bg-white border-y border-gray-200">
        {/* ── LEFT: Map ── */}
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
              {geojson && <ZipMarkers geojson={geojson} excludeZip={zip} />}
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
          <div className="absolute top-3 right-3 z-10">
            <ZipSelect currentZip={zip} style={{ width: 220 }} />
          </div>
        </div>

        {/* ── RIGHT: Sidebar ── */}
        <aside className="w-full lg:w-[35%] flex-shrink-0 min-h-0 bg-white border-t lg:border-t-0 lg:border-l border-gray-200 overflow-y-auto p-4">
          <div className="flex flex-col gap-4">
            {/* ZIP heading */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-5 py-4">
              <p className="text-2xl font-bold text-gray-900">
                {zip} · {cityStateText || '—'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Last updated: {cityState.lastUpdated}
              </p>
            </div>

            {/* ── Chart 1: ZIP Market Trend ── */}
            <ChartCard
              chartKey="market"
              onExpand={handleExpand}
              specPills={[]}
              icon={
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M1 6.5L8 1L15 6.5V15H10V10H6V15H1V6.5Z"
                    stroke="#006400"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                </svg>
              }
              iconBg="bg-[#006400]/8"
              title="ZIP Market Trend"
              subtitle="ZIP median price across all property types"
              headerRight={
                <Toggle
                  options={HISTORY_OPTIONS}
                  value={marketHistoryYears}
                  onChange={setMarketHistoryYears}
                  label="History"
                />
              }
              value={formatPrice(marketLatestPrice)}
              valueLabel="Latest ZIP median price"
              historicalData={marketAnalytics.historical}
              forecastData={[]}
              color="#006400"
            />

            {/* ── Chart 2: Your Property Estimate ── */}
            {hasPrediction ? (
              <ChartCard
                chartKey="property"
                onExpand={handleExpand}
                specPills={specPills}
                icon={
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect
                      x="1"
                      y="1"
                      width="14"
                      height="14"
                      rx="2"
                      stroke="#7c3aed"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M4 11l3-4 3 3 2-3"
                      stroke="#7c3aed"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                }
                iconBg="bg-violet-50"
                title="Your Property Estimate"
                subtitle="Historical sales for matching properties + ML model forecast"
                histNote="Historical shows median sale price for same beds/baths within ±15% of the inputted sqft"
                headerRight={
                  <div
                    className="flex flex-row items-center gap-6"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Toggle
                      options={HISTORY_OPTIONS}
                      value={propertyHistoryYears}
                      onChange={setPropertyHistoryYears}
                      label="History"
                      insufficientYears={propertyHistorySpanYears}
                    />
                    <div className="w-px h-4 bg-gray-200" />
                    <Toggle
                      options={FORECAST_OPTIONS}
                      value={forecastYears}
                      onChange={setForecastYears}
                      label="Forecast"
                    />
                  </div>
                }
                value={formatPrice(propertyLatestPrice)}
                valueLabel="ML price estimate for your inputs"
                historicalData={propertyHistorical}
                forecastData={slicedForecast}
                color="#7c3aed"
                forecastColor="#a78bfa"
              />
            ) : (
              /* Shown when user browsed directly to a ZIP (no prediction) */
              <div className="bg-gray-50 rounded-xl p-5 border border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 text-center min-h-[140px]">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <path
                    d="M4 11L14 3L24 11V25H18V17H10V25H4V11Z"
                    stroke="#9ca3af"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                  <circle cx="20" cy="8" r="5" fill="#7c3aed" />
                  <path
                    d="M20 6v2.5l1.5 1.5"
                    stroke="white"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />
                </svg>
                <p className="text-sm font-semibold text-gray-600">
                  No property estimate yet
                </p>
                <p className="text-xs text-gray-400">
                  Use <span className="font-semibold">Analyze Property</span> on
                  the map page to get an ML price estimate with a forecast for
                  specific beds, baths &amp; sqft.
                </p>
              </div>
            )}
          </div>
        </aside>

        {/* ── Modal ── */}
        {activeModal && (
          <div
            className="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-6"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setActiveModal(null);
            }}
          >
            <div
              className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
              role="dialog"
              aria-modal="true"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {activeModal === 'market'
                      ? 'ZIP Market Trend'
                      : 'Your Property Estimate'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    ZIP {zip} · {cityStateText || '—'}
                    {activeModal === 'market' &&
                      ' · ZIP-level only, no property filter'}
                    {activeModal === 'property' &&
                      hasPrediction &&
                      ` · ${specPills.join(' · ')}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {activeModal === 'market' && (
                    <Toggle
                      options={HISTORY_OPTIONS}
                      value={marketHistoryYears}
                      onChange={setMarketHistoryYears}
                      label="History"
                    />
                  )}
                  {activeModal === 'property' && (
                    <div className="flex items-center gap-3">
                      <Toggle
                        options={HISTORY_OPTIONS}
                        value={propertyHistoryYears}
                        onChange={setPropertyHistoryYears}
                        label="History"
                        insufficientYears={propertyHistorySpanYears}
                      />
                      <Toggle
                        options={FORECAST_OPTIONS}
                        value={forecastYears}
                        onChange={setForecastYears}
                        label="Forecast"
                      />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                    aria-label="Close"
                  >
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path
                        d="M4.5 4.5L13.5 13.5M13.5 4.5L4.5 13.5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="p-6 overflow-y-auto">
                {activeModal === 'market' && (
                  <LineChart
                    historicalData={marketAnalytics.historical}
                    forecastData={[]}
                    color="#006400"
                    yFormatter={priceTick}
                    tooltipFormatter={priceTooltip}
                    height={360}
                  />
                )}
                {activeModal === 'property' && hasPrediction && (
                  <LineChart
                    historicalData={propertyHistorical}
                    forecastData={slicedForecast}
                    color="#7c3aed"
                    forecastColor="#a78bfa"
                    yFormatter={priceTick}
                    tooltipFormatter={priceTooltip}
                    height={360}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
