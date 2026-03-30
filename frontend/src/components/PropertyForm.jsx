import { useEffect, useRef, useState } from 'react';

const PRICE_FLOOR = 0;
const PRICE_CEILING = 2000000;
const PRICE_STEP = 10000;
const HISTOGRAM_BARS = [
  8, 12, 16, 22, 30, 36, 44, 52, 60, 66, 72, 78, 82, 86, 90, 94, 98, 96, 92, 88, 84, 78, 72, 66,
  58, 50, 42, 36, 30, 26, 22, 18, 16, 14, 12, 10,
];

export default function PropertyForm({ selectedZip, setSelectedZip }) {
  const [formData, setFormData] = useState({
    zip: selectedZip || '',
    bedrooms: '',
    bathrooms: '',
    sqft: '',
    minPrice: '',
    maxPrice: '',
    timeRange: 'Last 3 years',
  });
  const [isBedsBathsOpen, setIsBedsBathsOpen] = useState(false);
  const [isPriceOpen, setIsPriceOpen] = useState(false);
  const [pendingBedsBaths, setPendingBedsBaths] = useState({
    bedrooms: '',
    bathrooms: '',
  });
  const [pendingPrice, setPendingPrice] = useState({
    minPrice: '',
    maxPrice: '',
  });
  const [activePriceHandle, setActivePriceHandle] = useState(null);
  const bedsBathsRef = useRef(null);
  const priceRef = useRef(null);
  const priceHistogramRef = useRef(null);

  const numericFields = new Set(['sqft', 'minPrice', 'maxPrice']);

  const sanitizeNumericInput = (value) => {
    if (value === '') return '';
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return '';
    return Math.max(0, parsed);
  };

  const getBedsBathsLabel = () => {
    const { bedrooms, bathrooms } = formData;
    if (!bedrooms && !bathrooms) return 'Beds & Baths';
    if (bedrooms && bathrooms) return `${bedrooms}+ bd • ${bathrooms}+ ba`;
    if (bedrooms) return `${bedrooms}+ bd`;
    return `${bathrooms}+ ba`;
  };

  const formatPriceLabel = (value) => {
    const amount = Number(value);
    if (!Number.isFinite(amount) || amount <= 0) return '';
    if (amount >= 1000000) {
      const inMillions = amount / 1000000;
      return `$${Number.isInteger(inMillions) ? inMillions : inMillions.toFixed(1)}M`;
    }
    if (amount >= 1000) return `$${Math.round(amount / 1000)}K`;
    return `$${Math.round(amount)}`;
  };

  const formatCompactPriceLabel = (value) => {
    const amount = Number(value);
    if (!Number.isFinite(amount) || amount <= 0) return '$0';
    if (amount >= 10000000) return '$10M+';
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
    return `${formatCompactPriceLabel(min)}-${formatCompactPriceLabel(max)}`;
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

  useEffect(() => {
    setFormData((prev) => ({ ...prev, zip: selectedZip || '' }));
  }, [selectedZip]);

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

    if (numericFields.has(name)) {
      const sanitized = sanitizeNumericInput(value);
      setFormData((prev) => ({ ...prev, [name]: sanitized }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'zip') setSelectedZip(value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Property data submitted:', formData);
  };

  const normalizedPending = getNormalizedPendingPrice();
  const sliderMinValue = normalizedPending.min ?? PRICE_FLOOR;
  const sliderMaxValue = normalizedPending.max ?? PRICE_CEILING;
  const minPercent = ((sliderMinValue - PRICE_FLOOR) / (PRICE_CEILING - PRICE_FLOOR)) * 100;
  const maxPercent = ((sliderMaxValue - PRICE_FLOOR) / (PRICE_CEILING - PRICE_FLOOR)) * 100;

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="rounded-xl border border-gray-200 bg-white px-3 py-3 shadow-[0_2px_10px_rgba(15,23,42,0.06)]">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="min-w-[160px] flex-1">
            <div className="relative">
              <label className="pointer-events-none absolute left-4 top-[6px] text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                ZIP Code
              </label>
              <input
                type="text"
                name="zip"
                value={formData.zip}
                onChange={handleChange}
                placeholder="Enter ZIP"
                className="h-11 w-full rounded-full border border-gray-300 bg-white px-4 pb-[7px] pt-4 text-sm text-gray-900 outline-none transition-all focus:border-[#006400] focus:ring-2 focus:ring-[#006400]/20"
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
              className="h-10 w-full rounded-full border border-gray-300 bg-white px-4 text-left text-sm text-gray-900 outline-none transition-all hover:border-gray-400 focus-visible:border-[#006400] focus-visible:ring-2 focus-visible:ring-[#006400]/20"
            >
              {getBedsBathsLabel()}
            </button>

            {isBedsBathsOpen && (
              <div className="absolute left-0 top-[calc(100%+8px)] z-20 w-[270px] rounded-xl border border-gray-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.12)]">
                <div className="mb-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-600">
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
                        className={`h-8 rounded-full px-3 text-xs font-medium transition ${
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
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-600">
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
                        className={`h-8 rounded-full px-3 text-xs font-medium transition ${
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

                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={applyBedsBaths}
                    className="h-8 rounded-full bg-[#006400] px-4 text-xs font-semibold text-white transition-shadow hover:shadow-[inset_0_0_0_9999px_rgba(0,0,0,0.12)] active:shadow-[inset_0_0_0_9999px_rgba(0,0,0,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006400]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="min-w-[140px] flex-1">
            <div className="relative">
              <label className="pointer-events-none absolute left-4 top-[6px] text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                Square Footage
              </label>
              <input
                type="number"
                name="sqft"
                value={formData.sqft}
                onChange={handleChange}
                placeholder="Any"
                min="0"
                className="h-11 w-full rounded-full border border-gray-300 bg-white px-4 pb-[7px] pt-4 text-sm text-gray-900 outline-none transition-all focus:border-[#006400] focus:ring-2 focus:ring-[#006400]/20"
              />
            </div>
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
              className="h-10 w-full rounded-full border border-gray-300 bg-white px-4 text-left text-sm text-gray-900 outline-none transition-all hover:border-gray-400 focus-visible:border-[#006400] focus-visible:ring-2 focus-visible:ring-[#006400]/20"
            >
              <span className="block text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                Price
              </span>
              <span className="block truncate text-sm font-medium text-gray-900">{getPriceSummaryLabel()}</span>
            </button>

            {isPriceOpen && (
              <div className="absolute left-0 top-[calc(100%+8px)] z-20 w-[360px] rounded-2xl border border-gray-200 bg-white p-4 shadow-[0_14px_36px_rgba(15,23,42,0.14)]">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">Price Range</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {normalizedPending.min === null && normalizedPending.max === null
                      ? 'Any Price'
                      : `${normalizedPending.min === null ? '$0' : formatCompactPriceLabel(normalizedPending.min)} - ${
                          normalizedPending.max === null ? formatPriceLabel(PRICE_CEILING) : formatPriceLabel(normalizedPending.max)
                        }`}
                  </p>
                </div>

                <div className="mb-3">
                  <div className="mb-2 flex items-center justify-between text-xs font-medium text-gray-500">
                    <span>{normalizedPending.min === null ? '$0' : formatCompactPriceLabel(normalizedPending.min)}</span>
                    <span>{normalizedPending.max === null ? formatCompactPriceLabel(PRICE_CEILING) : formatCompactPriceLabel(normalizedPending.max)}</span>
                  </div>

                  <div ref={priceHistogramRef} className="relative h-24 select-none rounded-xl border border-gray-200 bg-gray-50/70 px-2 py-2">
                    <div className="absolute inset-x-2 bottom-2 top-2 flex items-end gap-[3px]">
                      {HISTOGRAM_BARS.map((height, index) => {
                        const barCenterPercent = ((index + 0.5) / HISTOGRAM_BARS.length) * 100;
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
                      className="absolute bottom-2 top-2 rounded-lg bg-[#006400]/12"
                      style={{
                        left: `${minPercent}%`,
                        width: `${Math.max(maxPercent - minPercent, 1)}%`,
                      }}
                    />

                    <div
                      className="absolute bottom-2 top-2 w-[3px] -translate-x-1/2 rounded-full bg-[#006400]"
                      style={{ left: `${minPercent}%` }}
                    />
                    <div
                      className="absolute bottom-2 top-2 w-[3px] -translate-x-1/2 rounded-full bg-[#006400]"
                      style={{ left: `${maxPercent}%` }}
                    />

                    <button
                      type="button"
                      onMouseDown={(event) => {
                        event.preventDefault();
                        setActivePriceHandle('min');
                      }}
                      className={`absolute bottom-1 h-5 w-5 -translate-x-1/2 rounded-full border border-[#006400] bg-white shadow-[0_2px_6px_rgba(15,23,42,0.2)] transition ${
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
                      className={`absolute bottom-1 h-5 w-5 -translate-x-1/2 rounded-full border border-[#006400] bg-white shadow-[0_2px_6px_rgba(15,23,42,0.2)] transition ${
                        activePriceHandle === 'max' ? 'ring-2 ring-[#006400]/30' : ''
                      }`}
                      style={{ left: `${maxPercent}%` }}
                      aria-label="Set maximum price"
                    />
                  </div>

                  <div className="mt-1 flex items-center justify-between text-[11px] font-medium text-gray-500">
                    <span>$0</span>
                    <span>{formatCompactPriceLabel(PRICE_CEILING)}</span>
                  </div>
                </div>

                <div className="mb-3 grid grid-cols-2 gap-2.5">
                  <div>
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                      Min Price
                    </p>
                    <input
                      type="text"
                      value={pendingPrice.minPrice}
                      onChange={(e) => handlePendingMinInput(e.target.value)}
                      placeholder="No Min"
                      className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition-all focus:border-[#006400] focus:ring-2 focus:ring-[#006400]/20"
                    />
                  </div>
                  <div>
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                      Max Price
                    </p>
                    <input
                      type="text"
                      value={pendingPrice.maxPrice}
                      onChange={(e) => handlePendingMaxInput(e.target.value)}
                      placeholder="No Max"
                      className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition-all focus:border-[#006400] focus:ring-2 focus:ring-[#006400]/20"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setPendingPrice({ minPrice: '', maxPrice: '' })}
                    className="text-xs font-semibold text-gray-500 transition hover:text-gray-700"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={applyPrice}
                    className="h-8 rounded-full bg-[#006400] px-4 text-xs font-semibold text-white transition-shadow hover:shadow-[inset_0_0_0_9999px_rgba(0,0,0,0.12)] active:shadow-[inset_0_0_0_9999px_rgba(0,0,0,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006400]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="min-w-[160px] flex-1">
            <select
              name="timeRange"
              value={formData.timeRange}
              onChange={handleChange}
              className="h-10 w-full rounded-full border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none transition-all focus:border-[#006400] focus:ring-2 focus:ring-[#006400]/20"
            >
              <option>Last 1 year</option>
              <option>Last 3 years</option>
              <option>Last 5 years</option>
              <option>Last 10 years</option>
            </select>
          </div>

          <button
            type="submit"
            className="h-10 min-w-[170px] rounded-full bg-[#006400] px-5 text-sm font-semibold text-white transition-shadow hover:shadow-[inset_0_0_0_9999px_rgba(0,0,0,0.12)] active:shadow-[inset_0_0_0_9999px_rgba(0,0,0,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006400]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            Analyze Property
          </button>
        </div>
      </div>
    </form>
  );
}
