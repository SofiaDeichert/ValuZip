import { useState, useEffect } from 'react';

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

  useEffect(() => {
    setFormData((prev) => ({ ...prev, zip: selectedZip || '' }));
  }, [selectedZip]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'zip') setSelectedZip(value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Property data submitted:', formData);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="rounded-xl border border-gray-200 bg-white px-3 py-3 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[150px] flex-1">
            <label className="mb-1 block text-xs font-semibold text-gray-700">
              ZIP Code
            </label>
            <input
              type="text"
              name="zip"
              value={formData.zip}
              onChange={handleChange}
              placeholder="Enter ZIP"
              className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition-all focus:border-[#006400] focus:ring-2 focus:ring-[#006400]/20"
            />
          </div>

          <div className="min-w-[120px] flex-1">
            <label className="mb-1 block text-xs font-semibold text-gray-700">
              Bedrooms
            </label>
            <input
              type="number"
              name="bedrooms"
              value={formData.bedrooms}
              onChange={handleChange}
              placeholder="Any"
              className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition-all focus:border-[#006400] focus:ring-2 focus:ring-[#006400]/20"
            />
          </div>

          <div className="min-w-[120px] flex-1">
            <label className="mb-1 block text-xs font-semibold text-gray-700">
              Bathrooms
            </label>
            <input
              type="number"
              name="bathrooms"
              value={formData.bathrooms}
              onChange={handleChange}
              placeholder="Any"
              className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition-all focus:border-[#006400] focus:ring-2 focus:ring-[#006400]/20"
            />
          </div>

          <div className="min-w-[150px] flex-1">
            <label className="mb-1 block text-xs font-semibold text-gray-700">
              Square Footage
            </label>
            <input
              type="number"
              name="sqft"
              value={formData.sqft}
              onChange={handleChange}
              placeholder="Any"
              className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition-all focus:border-[#006400] focus:ring-2 focus:ring-[#006400]/20"
            />
          </div>

          <div className="min-w-[135px] flex-1">
            <label className="mb-1 block text-xs font-semibold text-gray-700">
              Min Price
            </label>
            <input
              type="number"
              name="minPrice"
              value={formData.minPrice}
              onChange={handleChange}
              placeholder="$ Min"
              className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition-all focus:border-[#006400] focus:ring-2 focus:ring-[#006400]/20"
            />
          </div>

          <div className="min-w-[135px] flex-1">
            <label className="mb-1 block text-xs font-semibold text-gray-700">
              Max Price
            </label>
            <input
              type="number"
              name="maxPrice"
              value={formData.maxPrice}
              onChange={handleChange}
              placeholder="$ Max"
              className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition-all focus:border-[#006400] focus:ring-2 focus:ring-[#006400]/20"
            />
          </div>

          <div className="min-w-[160px] flex-1">
            <label className="mb-1 block text-xs font-semibold text-gray-700">
              Time Range
            </label>
            <select
              name="timeRange"
              value={formData.timeRange}
              onChange={handleChange}
              className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition-all focus:border-[#006400] focus:ring-2 focus:ring-[#006400]/20"
            >
              <option>Last 1 year</option>
              <option>Last 3 years</option>
              <option>Last 5 years</option>
              <option>Last 10 years</option>
            </select>
          </div>

          <button
            type="submit"
            className="h-10 min-w-[170px] rounded-lg bg-[#006400] px-4 text-sm font-semibold text-white transition-shadow hover:shadow-[inset_0_0_0_9999px_rgba(0,0,0,0.12)] active:shadow-[inset_0_0_0_9999px_rgba(0,0,0,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006400]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            Analyze Property
          </button>
        </div>
      </div>
    </form>
  );
}
