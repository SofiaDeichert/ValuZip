import { useEffect, useRef, useState } from 'react';
import { parseTimeRangeYears } from '../utils/propertyAnalysis';
import load10yrData from '../utils/load10yrData';
import loadRecent3yrData from '../utils/loadRecent3yrData';

const PRICE_FLOOR = 0;
const PRICE_CEILING = 10000000;
const PRICE_STEP = 50000;
const SQFT_FLOOR = 0;
const SQFT_CEILING = 10000;
const PRICE_HISTOGRAM_BINS = 36;

export default function PropertyForm({ selectedZip, setSelectedZip }) {
  const defaultFormData = {
    zip: '',
    bedrooms: '',
    bathrooms: '',
    sqft: '',
    minSqft: '',
    maxSqft: '',
    minPrice: '',
    maxPrice: '',
    timeRange: 'Last 3 years',
  };

  const [formData, setFormData] = useState({
    ...defaultFormData,
    zip: selectedZip || '',
  });

  const [isBedsBathsOpen, setIsBedsBathsOpen] = useState(false);
  const [isPriceOpen, setIsPriceOpen] = useState(false);
  const [isSqftOpen, setIsSqftOpen] = useState(false);

  const [pendingBedsBaths, setPendingBedsBaths] = useState({
    bedrooms: '',
    bathrooms: '',
  });

  const [pendingPrice, setPendingPrice] = useState({
    minPrice: '',
    maxPrice: '',
  });

  const [pendingSqft, setPendingSqft] = useState({
    minSqft: '',
    maxSqft: '',
  });

  const [activePriceHandle, setActivePriceHandle] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [priceHistogramHeights, setPriceHistogramHeights] = useState(
    Array(PRICE_HISTOGRAM_BINS).fill(0),
  );

  const bedsBathsRef = useRef(null);
  const priceRef = useRef(null);
  const sqftRef = useRef(null);
  const priceHistogramRef = useRef(null);

  const numericFields = new Set(['sqft', 'minPrice', 'maxPrice', 'minSqft', 'maxSqft']);

  const sanitizeNumericInput = (value) => {
    if (value === '') return '';
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return '';
    return Math.max(0, parsed);
  };

  const sanitizeZipInput = (value) => value.replace(/\D/g, '').slice(0, 5);

  const getBedsBathsLabel = () => {
    const { bedrooms, bathrooms } = formData;
    if (!bedrooms && !bathrooms) return 'Beds & Baths';
    if (bedrooms && bathrooms) return `${bedrooms}+ bd • ${bathrooms}+ ba`;
    if (bedrooms) return `${bedrooms}+ bd`;
    return `${bathrooms}+ ba`;
  };

  const isZipActive = Boolean(String(formData.zip || '').trim());
  const isBedsBathsActive = Boolean(formData.bedrooms || formData.bathrooms);
  const isSqftActive = Boolean(formData.minSqft || formData.maxSqft);
  const isPriceActive = Boolean(formData.minPrice || formData.maxPrice);
  const isTimeRangeActive = formData.timeRange !== defaultFormData.timeRange;
  const hasAnyActiveFilters =
    isZipActive || isBedsBathsActive || isSqftActive || isPriceActive || isTimeRangeActive;

  const filterControlTransition =
    'transition-[border-color,box-shadow,background-color] duration-200 ease-out';

  const getFilterControlClass = (isActive) =>
    `h-12 w-full rounded-lg border bg-white px-4 text-left text-gray-900 outline-none ${filterControlTransition} ${
      isActive
        ? 'border-[#006400]/45 bg-[#006400]/[0.04] shadow-[inset_0_0_0_1px_rgba(0,100,0,0.05)] hover:border-[#006400]/55 hover:shadow-[inset_0_0_0_1px_rgba(0,100,0,0.07),0_1px_2px_rgba(15,23,42,0.04)]'
        : 'border-gray-200/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] hover:border-gray-300 hover:shadow-[0_1px_2px_rgba(15,23,42,0.05),inset_0_0_0_1px_rgba(15,23,42,0.03)]'
    } focus-visible:border-[#006400] focus-visible:ring-2 focus-visible:ring-[#006400]/22 focus-visible:ring-offset-0`;

  const getFilterValueClass = (isActive) =>
    `block truncate text-base ${isActive ? 'font-bold text-gray-950' : 'font-semibold text-gray-900'}`;

  const formatCompactPriceLabel = (value) => {
    const amount = Number(value);
    if (!Number.isFinite(amount) || amount <= 0) return '$0';
    if (amount >= PRICE_CEILING) return '$10M+';
    if (amount >= 1000000) {
      const inMillions = amount / 1000000;
      return `$${Number.isInteger(inMillions) ? inMillions : inMillions.toFixed(1)}M`;
    }
    return `$${Math.round(amount / 1000)}K`;
  };

  const clampPrice = (value) => {
    if (!Number.isFinite(value)) return null;
    return Math.min(PRICE_CEILING, Math.max(PRICE_FLOOR, value));
  };

  const sanitizePriceTextInput = (value) => {
    if (value === '') return '';
    const digitsOnly = String(value).replace(/[^\d]/g, '');
    if (!digitsOnly) return '';
    const parsed = Number(digitsOnly);
    if (!Number.isFinite(parsed)) return '';
    return parsed;
  };

  const getNormalizedPendingPrice = () => {
    const rawMin = pendingPrice.minPrice === '' ? null : clampPrice(Number(pendingPrice.minPrice));
    const rawMax = pendingPrice.maxPrice === '' ? null : clampPrice(Number(pendingPrice.maxPrice));

    if (rawMin !== null && rawMax !== null && rawMin > rawMax) {
      return { min: rawMin, max: rawMin };
    }

    return { min: rawMin, max: rawMax };
  };

  const getPriceSummaryLabel = () => {
    const min = Number(formData.minPrice);
    const max = Number(formData.maxPrice);
    const hasMin = Number.isFinite(min) && min > 0;
    const hasMax = Number.isFinite(max) && max > 0;

    if (!hasMin && !hasMax) return 'Any Price';
    if (!hasMin && hasMax) return `Under ${formatCompactPriceLabel(max)}`;
    if (hasMin && !hasMax) return `${formatCompactPriceLabel(min)}+`;
    if (hasMin && hasMax && max >= PRICE_CEILING) {
      return `${formatCompactPriceLabel(min)}-${formatCompactPriceLabel(PRICE_CEILING)}`;
    }
    return `${formatCompactPriceLabel(min)}-${formatCompactPriceLabel(max)}`;
  };

  const clampSqft = (value) => {
    if (!Number.isFinite(value)) return null;
    return Math.min(SQFT_CEILING, Math.max(SQFT_FLOOR, value));
  };

  const sanitizeSqftTextInput = (value) => {
    if (value === '') return '';
    const digitsOnly = String(value).replace(/[^\d]/g, '');
    if (!digitsOnly) return '';
    const parsed = Number(digitsOnly);
    if (!Number.isFinite(parsed)) return '';
    return parsed;
  };

  const formatSqftLabel = (value) => {
    const amount = Number(value);
    if (!Number.isFinite(amount) || amount < 0) return '';
    return amount.toLocaleString('en-US');
  };

  const getNormalizedPendingSqft = () => {
    const rawMin = pendingSqft.minSqft === '' ? null : clampSqft(Number(pendingSqft.minSqft));
    const rawMax = pendingSqft.maxSqft === '' ? null : clampSqft(Number(pendingSqft.maxSqft));

    if (rawMin !== null && rawMax !== null && rawMin > rawMax) {
      return { min: rawMin, max: rawMin };
    }

    return { min: rawMin, max: rawMax };
  };

  const getSqftSummaryLabel = () => {
    const min = Number(formData.minSqft);
    const max = Number(formData.maxSqft);
    const hasMin = Number.isFinite(min) && min > 0;
    const hasMax = Number.isFinite(max) && max > 0;

    if (!hasMin && !hasMax) return 'Any Sq Ft';
    if (!hasMin && hasMax) return `Under ${formatSqftLabel(max)} sqft`;
    if (hasMin && !hasMax) return `${formatSqftLabel(min)}+ sqft`;
    if (hasMin && hasMax && max >= SQFT_CEILING) {
      return `${formatSqftLabel(min)}-${formatSqftLabel(SQFT_CEILING)}+ sqft`;
    }
    return `${formatSqftLabel(min)}-${formatSqftLabel(max)} sqft`;
  };

  const applyBedsBaths = () => {
    setFormData((prev) => ({
      ...prev,
      bedrooms: pendingBedsBaths.bedrooms,
      bathrooms: pendingBedsBaths.bathrooms,
    }));
    setIsBedsBathsOpen(false);
  };

  const applyPrice = () => {
    const { min, max } = getNormalizedPendingPrice();
    setFormData((prev) => ({
      ...prev,
      minPrice: min === null ? '' : min,
      maxPrice: max === null ? '' : max,
    }));
    setIsPriceOpen(false);
  };

  const applySqft = () => {
    const normalized = getNormalizedPendingSqft();
    const minSqft = normalized.min === null ? '' : normalized.min;
    const maxSqft = normalized.max === null ? '' : normalized.max;
    setFormData((prev) => ({
      ...prev,
      minSqft,
      maxSqft,
      sqft: minSqft,
    }));
    setIsSqftOpen(false);
  };

  const handlePendingMinInput = (value) => {
    const sanitized = sanitizePriceTextInput(value);
    if (sanitized === '') {
      setPendingPrice((prev) => ({ ...prev, minPrice: '' }));
      return;
    }

    const minValue = clampPrice(Number(sanitized));
    setPendingPrice((prev) => {
      const existingMax =
        prev.maxPrice === '' ? null : clampPrice(Number(prev.maxPrice));
      const nextMax = existingMax !== null && existingMax < minValue ? minValue : existingMax;
      return {
        minPrice: minValue,
        maxPrice: nextMax === null ? '' : nextMax,
      };
    });
  };

  const handlePendingMaxInput = (value) => {
    const sanitized = sanitizePriceTextInput(value);
    if (sanitized === '') {
      setPendingPrice((prev) => ({ ...prev, maxPrice: '' }));
      return;
    }

    const maxValue = clampPrice(Number(sanitized));
    setPendingPrice((prev) => {
      const existingMin =
        prev.minPrice === '' ? null : clampPrice(Number(prev.minPrice));
      const nextMin = existingMin !== null && existingMin > maxValue ? maxValue : existingMin;
      return {
        minPrice: nextMin === null ? '' : nextMin,
        maxPrice: maxValue,
      };
    });
  };

  const handlePendingMinSqftInput = (value) => {
    const sanitized = sanitizeSqftTextInput(value);
    if (sanitized === '') {
      setPendingSqft((prev) => ({ ...prev, minSqft: '' }));
      return;
    }

    const minValue = clampSqft(Number(sanitized));
    setPendingSqft((prev) => {
      const existingMax = prev.maxSqft === '' ? null : clampSqft(Number(prev.maxSqft));
      const nextMax = existingMax !== null && existingMax < minValue ? minValue : existingMax;
      return {
        minSqft: minValue,
        maxSqft: nextMax === null ? '' : nextMax,
      };
    });
  };

  const handlePendingMaxSqftInput = (value) => {
    const sanitized = sanitizeSqftTextInput(value);
    if (sanitized === '') {
      setPendingSqft((prev) => ({ ...prev, maxSqft: '' }));
      return;
    }

    const maxValue = clampSqft(Number(sanitized));
    setPendingSqft((prev) => {
      const existingMin = prev.minSqft === '' ? null : clampSqft(Number(prev.minSqft));
      const nextMin = existingMin !== null && existingMin > maxValue ? maxValue : existingMin;
      return {
        minSqft: nextMin === null ? '' : nextMin,
        maxSqft: maxValue,
      };
    });
  };

  useEffect(() => {
    setFormData((prev) => ({ ...prev, zip: selectedZip || '' }));
  }, [selectedZip]);

  useEffect(() => {
    let alive = true;

    async function computeHistogram() {
      const normalizeZip = (zip) =>
        String(zip || '').replace(/\D/g, '').slice(0, 5);

      const zipNorm = normalizeZip(formData.zip);
      const bins = PRICE_HISTOGRAM_BINS;

      const empty = Array(bins).fill(0);
      if (!zipNorm || zipNorm.length !== 5) {
        if (alive) setPriceHistogramHeights(empty);
        return;
      }

      const years = parseTimeRangeYears(formData.timeRange);
      const cutoff = new Date();
      cutoff.setFullYear(cutoff.getFullYear() - years);
      cutoff.setHours(0, 0, 0, 0);

      const rows = years <= 3 ? await loadRecent3yrData() : await load10yrData();

      const binWidth = (PRICE_CEILING - PRICE_FLOOR) / bins;
      const counts = Array(bins).fill(0);

      for (let i = 0; i < rows.length; i += 1) {
        const r = rows[i];
        if (r.zip_code !== zipNorm) continue;
        if (!(r.date instanceof Date) || r.date < cutoff) continue;

        const p = r.sale_price;
        if (!Number.isFinite(p) || p <= 0) continue;

        const clamped = Math.min(PRICE_CEILING, Math.max(PRICE_FLOOR, p));
        const idx = Math.min(
          bins - 1,
          Math.floor((clamped - PRICE_FLOOR) / binWidth),
        );
        counts[idx] += 1;
      }

      const maxCount = Math.max(...counts);
      const heights = counts.map((c) => (maxCount > 0 ? (c / maxCount) * 100 : 0));
      if (alive) setPriceHistogramHeights(heights);
    }

    computeHistogram().catch(() => {
      if (!alive) return;
      setPriceHistogramHeights(Array(PRICE_HISTOGRAM_BINS).fill(0));
    });

    return () => {
      alive = false;
    };
  }, [formData.zip, formData.timeRange]);

  useEffect(() => {
    if (!isBedsBathsOpen) return;

    const handleClickOutside = (event) => {
      if (bedsBathsRef.current && !bedsBathsRef.current.contains(event.target)) {
        setIsBedsBathsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isBedsBathsOpen]);

  useEffect(() => {
    if (!isPriceOpen) return;

    const handleClickOutside = (event) => {
      if (priceRef.current && !priceRef.current.contains(event.target)) {
        setIsPriceOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isPriceOpen]);

  useEffect(() => {
    if (!isSqftOpen) return;

    const handleClickOutside = (event) => {
      if (sqftRef.current && !sqftRef.current.contains(event.target)) {
        setIsSqftOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSqftOpen]);

  useEffect(() => {
    if (!isPriceOpen || !activePriceHandle) return;

    const updateFromPointer = (clientX) => {
      if (!priceHistogramRef.current) return;
      const rect = priceHistogramRef.current.getBoundingClientRect();
      if (!rect.width) return;
      const clampedX = Math.min(Math.max(clientX, rect.left), rect.right);
      const percent = (clampedX - rect.left) / rect.width;
      const rawValue = PRICE_FLOOR + percent * (PRICE_CEILING - PRICE_FLOOR);
      const steppedValue = Math.round(rawValue / PRICE_STEP) * PRICE_STEP;
      const nextValue = clampPrice(steppedValue);

      setPendingPrice((prev) => {
        const existingMin = prev.minPrice === '' ? null : clampPrice(Number(prev.minPrice));
        const existingMax = prev.maxPrice === '' ? null : clampPrice(Number(prev.maxPrice));
        const currentMin = existingMin ?? PRICE_FLOOR;
        const currentMax = existingMax ?? PRICE_CEILING;

        if (activePriceHandle === 'min') {
          const nextMin = Math.min(nextValue, currentMax);
          return {
            minPrice: nextMin <= PRICE_FLOOR ? '' : nextMin,
            maxPrice: existingMax === null ? '' : currentMax,
          };
        }

        const nextMax = Math.max(nextValue, currentMin);
        return {
          minPrice: existingMin === null ? '' : currentMin,
          maxPrice: nextMax >= PRICE_CEILING ? '' : nextMax,
        };
      });
    };

    const handleMouseMove = (event) => updateFromPointer(event.clientX);
    const handleMouseUp = () => setActivePriceHandle(null);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [activePriceHandle, isPriceOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'zip') {
      const sanitized = sanitizeZipInput(value);
      setFormData((prev) => ({ ...prev, zip: sanitized }));
      setSelectedZip(sanitized);
      return;
    }

    if (numericFields.has(name)) {
      const sanitized = sanitizeNumericInput(value);
      setFormData((prev) => ({ ...prev, [name]: sanitized }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setPredictionResult(null);
    setAnalysisLoading(true);

    try {
      if (!formData.zip || String(formData.zip).length !== 5) {
        setSubmitError('Please enter a valid 5-digit ZIP code.');
        return;
      }

      const payload = {
        zip_code: String(formData.zip),
        beds: Number(formData.bedrooms) || 0,
        baths: Number(formData.bathrooms) || 0,
        sqft: Number(formData.sqft) || Number(formData.minSqft) || Number(formData.maxSqft) || 0,
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
      };

      const response = await fetch('http://127.0.0.1:8000/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error('Prediction failed');
      }

      setPredictionResult(data);
    } catch {
      setSubmitError('Could not get prediction from backend. Check that the backend is running.');
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleClearAll = () => {
    setFormData(defaultFormData);
    setPendingBedsBaths({ bedrooms: '', bathrooms: '' });
    setPendingPrice({ minPrice: '', maxPrice: '' });
    setPendingSqft({ minSqft: '', maxSqft: '' });
    setIsBedsBathsOpen(false);
    setIsPriceOpen(false);
    setIsSqftOpen(false);
    setActivePriceHandle(null);
    setSelectedZip('');
    setSubmitError(null);
    setPredictionResult(null);
  };

  const normalizedPending = getNormalizedPendingPrice();
  const sliderMinValue = normalizedPending.min ?? PRICE_FLOOR;
  const sliderMaxValue = normalizedPending.max ?? PRICE_CEILING;
  const minPercent = ((sliderMinValue - PRICE_FLOOR) / (PRICE_CEILING - PRICE_FLOOR)) * 100;
  const maxPercent = ((sliderMaxValue - PRICE_FLOOR) / (PRICE_CEILING - PRICE_FLOOR)) * 100;

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="rounded-lg border border-gray-200/90 bg-gray-50/90 px-4 py-3.5 shadow-[0_5px_16px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.65)]">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-[160px] flex-1">
            <div className="relative">
              <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="h-4 w-4 opacity-90" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="m14 14 3.5 3.5M9 15.5a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <label className="pointer-events-none absolute left-10 top-[6px] text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                ZIP Code
              </label>
              <input
                type="text"
                inputMode="numeric"
                name="zip"
                autoComplete="postal-code"
                maxLength={5}
                value={formData.zip}
                onChange={handleChange}
                placeholder="e.g. 75201"
                aria-label="ZIP code, 5 digits"
                className={`h-12 w-full rounded-lg border pl-10 pr-4 pb-[8px] pt-4.5 text-base tabular-nums tracking-wide text-gray-900 outline-none placeholder:text-gray-400 ${filterControlTransition} ${
                  isZipActive
                    ? 'border-[#006400]/45 bg-[#006400]/[0.04] font-bold text-gray-950 shadow-[inset_0_0_0_1px_rgba(0,100,0,0.05)] hover:border-[#006400]/55 hover:shadow-[inset_0_0_0_1px_rgba(0,100,0,0.07),0_1px_2px_rgba(15,23,42,0.04)]'
                    : 'border-gray-200/95 bg-white font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] hover:border-gray-300 hover:shadow-[0_1px_2px_rgba(15,23,42,0.05),inset_0_0_0_1px_rgba(15,23,42,0.03)]'
                } focus-visible:border-[#006400] focus-visible:ring-2 focus-visible:ring-[#006400]/22 focus-visible:ring-offset-0`}
              />
            </div>
          </div>

          <div ref={bedsBathsRef} className="relative min-w-[180px] flex-1">
            <button
              type="button"
              onClick={() => {
                setPendingBedsBaths({
                  bedrooms: formData.bedrooms,
                  bathrooms: formData.bathrooms,
                });
                setIsBedsBathsOpen((prev) => !prev);
              }}
              className={getFilterControlClass(isBedsBathsActive)}
            >
              <span className="flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2.5">
                  <span className="min-w-0">
                    <span className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                      Beds & Baths
                    </span>
                    <span className={getFilterValueClass(isBedsBathsActive)}>{getBedsBathsLabel()}</span>
                  </span>
                </span>
                <svg
                  className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${isBedsBathsOpen ? 'rotate-180' : ''}`}
                  viewBox="0 0 20 20"
                  fill="none"
                  aria-hidden="true"
                >
                  <path d="m5 7.5 5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </button>

            {isBedsBathsOpen && (
              <div className="absolute left-0 top-[calc(100%+10px)] z-20 w-[300px] rounded-lg border border-gray-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.14)]">
                <div className="mb-4">
                  <p className="mb-2.5 text-[13px] font-semibold uppercase tracking-wide text-gray-600">
                    Bedrooms
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: 'Any', value: '' },
                      { label: '1+', value: '1' },
                      { label: '2+', value: '2' },
                      { label: '3+', value: '3' },
                      { label: '4+', value: '4' },
                      { label: '5+', value: '5' },
                    ].map((option) => (
                      <button
                        key={`bedrooms-${option.label}`}
                        type="button"
                        onClick={() =>
                          setPendingBedsBaths((prev) => ({ ...prev, bedrooms: option.value }))
                        }
                        className={`h-9 rounded-md px-3.5 text-[13px] font-medium transition ${
                          pendingBedsBaths.bedrooms === option.value
                            ? 'bg-[#006400] text-white'
                            : 'border border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-2.5 text-[13px] font-semibold uppercase tracking-wide text-gray-600">
                    Bathrooms
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: 'Any', value: '' },
                      { label: '1+', value: '1' },
                      { label: '1.5+', value: '1.5' },
                      { label: '2+', value: '2' },
                      { label: '3+', value: '3' },
                      { label: '4+', value: '4' },
                    ].map((option) => (
                      <button
                        key={`bathrooms-${option.label}`}
                        type="button"
                        onClick={() =>
                          setPendingBedsBaths((prev) => ({ ...prev, bathrooms: option.value }))
                        }
                        className={`h-9 rounded-md px-3.5 text-[13px] font-medium transition ${
                          pendingBedsBaths.bathrooms === option.value
                            ? 'bg-[#006400] text-white'
                            : 'border border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-5 flex justify-end">
                  <button
                    type="button"
                    onClick={applyBedsBaths}
                    className="h-9 rounded-md bg-[#006400] px-5 text-[13px] font-semibold text-white transition-shadow hover:shadow-[inset_0_0_0_9999px_rgba(0,0,0,0.12)] active:shadow-[inset_0_0_0_9999px_rgba(0,0,0,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006400]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>

          <div ref={sqftRef} className="relative min-w-[170px] flex-1">
            <button
              type="button"
              onClick={() => {
                setPendingSqft({
                  minSqft: formData.minSqft || '',
                  maxSqft: formData.maxSqft || '',
                });
                setIsSqftOpen((prev) => !prev);
              }}
              className={getFilterControlClass(isSqftActive)}
            >
              <span className="flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2.5">
                  <span className="min-w-0">
                    <span className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                      Square Footage
                    </span>
                    <span className={getFilterValueClass(isSqftActive)}>{getSqftSummaryLabel()}</span>
                  </span>
                </span>
                <svg
                  className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${isSqftOpen ? 'rotate-180' : ''}`}
                  viewBox="0 0 20 20"
                  fill="none"
                  aria-hidden="true"
                >
                  <path d="m5 7.5 5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </button>

            {isSqftOpen && (
              <div className="absolute left-0 top-[calc(100%+10px)] z-20 w-[372px] rounded-lg border border-gray-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.14)]">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-[13px] font-semibold uppercase tracking-wide text-gray-600">Square Footage</p>
                  <p className="text-base font-semibold text-gray-900">{getSqftSummaryLabel()}</p>
                </div>

                <div className="mb-4 grid grid-cols-2 gap-3">
                  <div>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Min Sq Ft
                    </p>
                    <input
                      type="text"
                      value={pendingSqft.minSqft}
                      onChange={(e) => handlePendingMinSqftInput(e.target.value)}
                      placeholder="No Min"
                      className="h-10 w-full rounded-md border border-gray-300 bg-gray-50/40 px-3.5 text-[15px] text-gray-900 outline-none transition-all focus:border-[#006400] focus:ring-2 focus:ring-[#006400]/20"
                    />
                  </div>
                  <div>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Max Sq Ft
                    </p>
                    <input
                      type="text"
                      value={pendingSqft.maxSqft}
                      onChange={(e) => handlePendingMaxSqftInput(e.target.value)}
                      placeholder="No Max"
                      className="h-10 w-full rounded-md border border-gray-300 bg-gray-50/40 px-3.5 text-[15px] text-gray-900 outline-none transition-all focus:border-[#006400] focus:ring-2 focus:ring-[#006400]/20"
                    />
                  </div>
                </div>

                <div className="mb-5">
                  <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Quick Ranges
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: 'Under 1,500', min: '', max: 1500 },
                      { label: '1,500-3,000', min: 1500, max: 3000 },
                      { label: '3,000-5,000', min: 3000, max: 5000 },
                      { label: '5,000+', min: 5000, max: '' },
                    ].map((option) => {
                      const isActive =
                        String(pendingSqft.minSqft) === String(option.min) &&
                        String(pendingSqft.maxSqft) === String(option.max);
                      return (
                        <button
                          key={`sqft-${option.label}`}
                          type="button"
                          onClick={() =>
                            setPendingSqft({
                              minSqft: option.min,
                              maxSqft: option.max,
                            })
                          }
                          className={`h-9 rounded-md px-3.5 text-[13px] font-medium transition ${
                            isActive
                              ? 'bg-[#006400] text-white'
                              : 'border border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setPendingSqft({ minSqft: '', maxSqft: '' })}
                    className="text-sm font-semibold text-gray-500 transition hover:text-gray-700"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={applySqft}
                    className="h-9 rounded-md bg-[#006400] px-5 text-[13px] font-semibold text-white transition-shadow hover:shadow-[inset_0_0_0_9999px_rgba(0,0,0,0.12)] active:shadow-[inset_0_0_0_9999px_rgba(0,0,0,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006400]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>

          <div ref={priceRef} className="relative min-w-[150px] flex-1">
            <button
              type="button"
              onClick={() => {
                setPendingPrice({
                  minPrice: formData.minPrice,
                  maxPrice: formData.maxPrice,
                });
                setActivePriceHandle(null);
                setIsPriceOpen((prev) => !prev);
              }}
              className={getFilterControlClass(isPriceActive)}
            >
              <span className="flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2.5">
                  <span className="min-w-0">
                    <span className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                      Price
                    </span>
                    <span className={getFilterValueClass(isPriceActive)}>{getPriceSummaryLabel()}</span>
                  </span>
                </span>
                <svg
                  className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${isPriceOpen ? 'rotate-180' : ''}`}
                  viewBox="0 0 20 20"
                  fill="none"
                  aria-hidden="true"
                >
                  <path d="m5 7.5 5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </button>

            {isPriceOpen && (
              <div className="absolute left-0 top-[calc(100%+10px)] z-20 w-[398px] rounded-lg border border-gray-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.14)]">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-[13px] font-semibold uppercase tracking-wide text-gray-600">Price Range</p>
                  <p className="text-base font-semibold text-gray-900">
                    {normalizedPending.min === null && normalizedPending.max === null
                      ? 'Any Price'
                      : `${normalizedPending.min === null ? '$0' : formatCompactPriceLabel(normalizedPending.min)} - ${
                          normalizedPending.max === null
                            ? formatCompactPriceLabel(PRICE_CEILING)
                            : formatCompactPriceLabel(normalizedPending.max)
                        }`}
                  </p>
                </div>

                <div className="mb-4">
                  <div className="mb-2.5 flex items-center justify-between text-sm font-medium text-gray-500">
                    <span>{normalizedPending.min === null ? '$0' : formatCompactPriceLabel(normalizedPending.min)}</span>
                    <span>{normalizedPending.max === null ? formatCompactPriceLabel(PRICE_CEILING) : formatCompactPriceLabel(normalizedPending.max)}</span>
                  </div>

                  <div ref={priceHistogramRef} className="relative h-28 select-none rounded-lg border border-gray-200 bg-gray-50/80 px-2.5 py-2.5">
                    <div className="absolute inset-x-2.5 bottom-2.5 top-2.5 flex items-end gap-[3px]">
                      {priceHistogramHeights.map((height, index) => {
                        const barCenterPercent =
                          ((index + 0.5) / priceHistogramHeights.length) * 100;
                        const inSelectedRange =
                          barCenterPercent >= minPercent && barCenterPercent <= maxPercent;
                        return (
                          <div
                            key={`histogram-bar-${index}`}
                            className={`flex-1 rounded-sm transition-colors ${
                              inSelectedRange ? 'bg-[#006400]/55' : 'bg-gray-300/90'
                            }`}
                            style={{ height: `${height}%` }}
                          />
                        );
                      })}
                    </div>

                    <div
                      className="absolute bottom-2.5 top-2.5 rounded-lg bg-[#006400]/12"
                      style={{
                        left: `${minPercent}%`,
                        width: `${Math.max(maxPercent - minPercent, 1)}%`,
                      }}
                    />

                    <div
                      className="absolute bottom-2.5 top-2.5 w-[3px] -translate-x-1/2 rounded-full bg-[#006400]"
                      style={{ left: `${minPercent}%` }}
                    />
                    <div
                      className="absolute bottom-2.5 top-2.5 w-[3px] -translate-x-1/2 rounded-full bg-[#006400]"
                      style={{ left: `${maxPercent}%` }}
                    />

                    <button
                      type="button"
                      onMouseDown={(event) => {
                        event.preventDefault();
                        setActivePriceHandle('min');
                      }}
                      className={`absolute bottom-1 h-5.5 w-5.5 -translate-x-1/2 rounded-full border border-[#006400] bg-white shadow-[0_2px_6px_rgba(15,23,42,0.2)] transition ${
                        activePriceHandle === 'min' ? 'ring-2 ring-[#006400]/30' : ''
                      }`}
                      style={{ left: `${minPercent}%` }}
                      aria-label="Set minimum price"
                    />
                    <button
                      type="button"
                      onMouseDown={(event) => {
                        event.preventDefault();
                        setActivePriceHandle('max');
                      }}
                      className={`absolute bottom-1 h-5.5 w-5.5 -translate-x-1/2 rounded-full border border-[#006400] bg-white shadow-[0_2px_6px_rgba(15,23,42,0.2)] transition ${
                        activePriceHandle === 'max' ? 'ring-2 ring-[#006400]/30' : ''
                      }`}
                      style={{ left: `${maxPercent}%` }}
                      aria-label="Set maximum price"
                    />
                  </div>

                  <div className="mt-2 flex items-center justify-between text-xs font-medium text-gray-500">
                    <span>$0</span>
                    <span>{formatCompactPriceLabel(PRICE_CEILING)}</span>
                  </div>
                </div>

                <div className="mb-4 grid grid-cols-2 gap-3">
                  <div>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Min Price
                    </p>
                    <input
                      type="text"
                      value={pendingPrice.minPrice}
                      onChange={(e) => handlePendingMinInput(e.target.value)}
                      placeholder="No Min"
                      className="h-10 w-full rounded-md border border-gray-300 bg-gray-50/40 px-3.5 text-[15px] text-gray-900 outline-none transition-all focus:border-[#006400] focus:ring-2 focus:ring-[#006400]/20"
                    />
                  </div>
                  <div>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Max Price
                    </p>
                    <input
                      type="text"
                      value={pendingPrice.maxPrice}
                      onChange={(e) => handlePendingMaxInput(e.target.value)}
                      placeholder="No Max"
                      className="h-10 w-full rounded-md border border-gray-300 bg-gray-50/40 px-3.5 text-[15px] text-gray-900 outline-none transition-all focus:border-[#006400] focus:ring-2 focus:ring-[#006400]/20"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setPendingPrice({ minPrice: '', maxPrice: '' })}
                    className="text-sm font-semibold text-gray-500 transition hover:text-gray-700"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={applyPrice}
                    className="h-9 rounded-md bg-[#006400] px-5 text-[13px] font-semibold text-white transition-shadow hover:shadow-[inset_0_0_0_9999px_rgba(0,0,0,0.12)] active:shadow-[inset_0_0_0_9999px_rgba(0,0,0,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006400]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="min-w-[160px] flex-1">
            <div className="relative">
              <label className="pointer-events-none absolute left-10 top-[6px] text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Time Range
              </label>
              <select
                name="timeRange"
                value={formData.timeRange}
                onChange={handleChange}
                className={`h-12 w-full appearance-none rounded-lg border pb-[8px] pl-10 pr-10 pt-4.5 text-base outline-none ${filterControlTransition} ${
                  isTimeRangeActive
                    ? 'border-[#006400]/45 bg-[#006400]/[0.04] font-bold text-gray-950 shadow-[inset_0_0_0_1px_rgba(0,100,0,0.05)] hover:border-[#006400]/55 hover:shadow-[inset_0_0_0_1px_rgba(0,100,0,0.07),0_1px_2px_rgba(15,23,42,0.04)]'
                    : 'border-gray-200/95 bg-white font-semibold text-gray-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] hover:border-gray-300 hover:shadow-[0_1px_2px_rgba(15,23,42,0.05),inset_0_0_0_1px_rgba(15,23,42,0.03)]'
                } focus-visible:border-[#006400] focus-visible:ring-2 focus-visible:ring-[#006400]/22 focus-visible:ring-offset-0`}
              >
                <option>Last 1 year</option>
                <option>Last 3 years</option>
                <option>Last 5 years</option>
                <option>Last 10 years</option>
              </select>
              <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="m5 7.5 5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClearAll}
            className={`h-12 rounded-md px-2 text-sm font-semibold transition-[color,background-color,box-shadow] duration-200 ease-out ${
              hasAnyActiveFilters
                ? 'text-gray-600 hover:bg-gray-100/85 hover:text-gray-800 active:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(249,250,251)]'
                : 'cursor-default text-gray-400'
            }`}
            disabled={!hasAnyActiveFilters}
            aria-label="Clear all filters"
          >
            Clear all
          </button>

          <button
            type="submit"
            disabled={analysisLoading}
            className="h-12 min-w-[170px] rounded-lg bg-[#006400] px-5 text-base font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.12)] transition-[box-shadow,transform,filter] duration-200 ease-out hover:shadow-[0_2px_6px_rgba(0,0,0,0.14),inset_0_0_0_9999px_rgba(0,0,0,0.06)] active:translate-y-px active:shadow-[0_1px_2px_rgba(0,0,0,0.14),inset_0_0_0_9999px_rgba(0,0,0,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006400]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:pointer-events-none disabled:opacity-60"
          >
            {analysisLoading ? 'Analyzing…' : 'Analyze Property'}
          </button>
        </div>

        {submitError && (
          <p className="mt-2 text-sm font-medium text-amber-800" role="alert">
            {submitError}
          </p>
        )}

        {predictionResult && (
          <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="text-lg font-semibold text-green-800">
              Predicted Price: ${Number(predictionResult.predicted_price).toLocaleString()}
            </p>
            <p className="mt-1 text-sm text-green-700">
              ZIP: {predictionResult.zip_code} • Beds: {predictionResult.beds} • Baths: {predictionResult.baths} • Sq Ft: {predictionResult.sqft}
            </p>
          </div>
        )}
      </div>
    </form>
  );
}