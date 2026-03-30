import { useEffect, useRef, useState } from 'react';

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
  const bedsBathsRef = useRef(null);
  const priceRef = useRef(null);

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

  const getPriceSummaryLabel = () => {
    const min = Number(formData.minPrice);
    const max = Number(formData.maxPrice);
    const hasMin = Number.isFinite(min) && min > 0;
    const hasMax = Number.isFinite(max) && max > 0;

    if (!hasMin && !hasMax) return 'Any Price';
    if (!hasMin && hasMax) return `Under ${formatPriceLabel(max)}`;
    if (hasMin && !hasMax) return `${formatPriceLabel(min)}+`;
    return `${formatPriceLabel(min)}-${formatPriceLabel(max)}`;
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
    setFormData((prev) => ({
      ...prev,
      minPrice: pendingPrice.minPrice,
      maxPrice: pendingPrice.maxPrice,
    }));
    setIsPriceOpen(false);
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
                setIsPriceOpen((prev) => !prev);
              }}
              className="h-10 w-full rounded-full border border-gray-300 bg-white px-4 text-left text-sm text-gray-900 outline-none transition-all hover:border-gray-400 focus-visible:border-[#006400] focus-visible:ring-2 focus-visible:ring-[#006400]/20"
            >
              <span className="mr-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Price
              </span>
              <span>{getPriceSummaryLabel()}</span>
            </button>

            {isPriceOpen && (
              <div className="absolute left-0 top-[calc(100%+8px)] z-20 w-[300px] rounded-xl border border-gray-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.12)]">
                <div className="mb-3 grid grid-cols-2 gap-2.5">
                  <div>
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                      Min Price
                    </p>
                    <input
                      type="number"
                      min="0"
                      value={pendingPrice.minPrice}
                      onChange={(e) =>
                        setPendingPrice((prev) => ({
                          ...prev,
                          minPrice: sanitizeNumericInput(e.target.value),
                        }))
                      }
                      placeholder="No Min"
                      className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition-all focus:border-[#006400] focus:ring-2 focus:ring-[#006400]/20"
                    />
                  </div>
                  <div>
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                      Max Price
                    </p>
                    <input
                      type="number"
                      min="0"
                      value={pendingPrice.maxPrice}
                      onChange={(e) =>
                        setPendingPrice((prev) => ({
                          ...prev,
                          maxPrice: sanitizeNumericInput(e.target.value),
                        }))
                      }
                      placeholder="No Max"
                      className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition-all focus:border-[#006400] focus:ring-2 focus:ring-[#006400]/20"
                    />
                  </div>
                </div>

                <div className="mb-4 flex flex-wrap gap-2">
                  {[
                    { label: 'Under $300K', minPrice: '', maxPrice: 300000 },
                    { label: '$300K-$600K', minPrice: 300000, maxPrice: 600000 },
                    { label: '$600K-$1M', minPrice: 600000, maxPrice: 1000000 },
                    { label: '$1M+', minPrice: 1000000, maxPrice: '' },
                  ].map((option) => {
                    const isActive =
                      String(pendingPrice.minPrice) === String(option.minPrice) &&
                      String(pendingPrice.maxPrice) === String(option.maxPrice);
                    return (
                      <button
                        key={option.label}
                        type="button"
                        onClick={() =>
                          setPendingPrice({
                            minPrice: option.minPrice,
                            maxPrice: option.maxPrice,
                          })
                        }
                        className={`h-8 rounded-full px-3 text-xs font-medium transition ${
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
