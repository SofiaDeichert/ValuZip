import { useEffect, useRef, useState } from 'react';

export default function PropertyForm({ selectedZip, setSelectedZip }) {
  const [formData, setFormData] = useState({
    zip: selectedZip || '',
    bedrooms: '',
    bathrooms: '',
    sqft: '',
    maxPrice: '',
    timeRange: 'Last 3 years',
  });
  const [isBedsBathsOpen, setIsBedsBathsOpen] = useState(false);
  const [pendingBedsBaths, setPendingBedsBaths] = useState({
    bedrooms: '',
    bathrooms: '',
  });
  const bedsBathsRef = useRef(null);

  const numericFields = new Set(['sqft', 'maxPrice']);

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

  const applyBedsBaths = () => {
    setFormData((prev) => ({
      ...prev,
      bedrooms: pendingBedsBaths.bedrooms,
      bathrooms: pendingBedsBaths.bathrooms,
    }));
    setIsBedsBathsOpen(false);
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
            <input
              type="text"
              name="zip"
              value={formData.zip}
              onChange={handleChange}
              placeholder="ZIP Code"
              className="h-10 w-full rounded-full border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none transition-all focus:border-[#006400] focus:ring-2 focus:ring-[#006400]/20"
            />
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
            <input
              type="number"
              name="sqft"
              value={formData.sqft}
              onChange={handleChange}
              placeholder="Square Footage"
              min="0"
              className="h-10 w-full rounded-full border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none transition-all focus:border-[#006400] focus:ring-2 focus:ring-[#006400]/20"
            />
          </div>

          <div className="min-w-[130px] flex-1">
            <input
              type="number"
              name="maxPrice"
              value={formData.maxPrice}
              onChange={handleChange}
              placeholder="Max Price"
              min="0"
              className="h-10 w-full rounded-full border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none transition-all focus:border-[#006400] focus:ring-2 focus:ring-[#006400]/20"
            />
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
