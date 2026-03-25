import { useState, useEffect } from 'react';

export default function PropertyForm({ selectedZip, setSelectedZip }) {
  const [formData, setFormData] = useState({
    zip: selectedZip || '',
    bedrooms: '',
    bathrooms: '',
    sqft: '',
    yearBuilt: '',
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
    <div className="w-full h-full bg-white box-border overflow-y-auto flex flex-col justify-start">
      <h2 className="text-4xl font-bold text-gray-900 mb-3">
        Property Details
      </h2>
      <p className="mt-2 mb-6 text-md text-gray-500">
        Enter property characteristics to estimate market value.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block mb-1.5 text-md font-semibold text-gray-800">
            ZIP Code
          </label>
          <input
            type="text"
            name="zip"
            value={formData.zip}
            onChange={handleChange}
            placeholder="Enter ZIP code"
            className="w-full px-3.5 py-3 rounded-xl border border-gray-300 text-sm bg-white outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all"
          />
        </div>
        <div>
          <label className="block mb-1.5 text-md font-semibold text-gray-800">
            Bedrooms
          </label>
          <input
            type="number"
            name="bedrooms"
            value={formData.bedrooms}
            onChange={handleChange}
            placeholder="e.g. 3"
            className="w-full px-3.5 py-3 rounded-xl border border-gray-300 text-sm bg-white outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all"
          />
        </div>
        <div>
          <label className="block mb-1.5 text-md font-semibold text-gray-800">
            Bathrooms
          </label>
          <input
            type="number"
            name="bathrooms"
            value={formData.bathrooms}
            onChange={handleChange}
            placeholder="e.g. 2"
            className="w-full px-3.5 py-3 rounded-xl border border-gray-300 text-sm bg-white outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all"
          />
        </div>
        <div>
          <label className="block mb-1.5 text-md font-semibold text-gray-800">
            Square Footage
          </label>
          <input
            type="number"
            name="sqft"
            value={formData.sqft}
            onChange={handleChange}
            placeholder="e.g. 1800"
            className="w-full px-3.5 py-3 rounded-xl border border-gray-300 text-sm bg-white outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all"
          />
        </div>
        <div>
          <label className="block mb-1.5 text-md font-semibold text-gray-800">
            Year Built
          </label>
          <input
            type="number"
            name="yearBuilt"
            value={formData.yearBuilt}
            onChange={handleChange}
            placeholder="e.g. 2015"
            className="w-full px-3.5 py-3 rounded-xl border border-gray-300 text-sm bg-white outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all"
          />
        </div>
        <button
          type="submit"
          className="mt-2 py-3.5 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white text-base font-bold rounded-xl shadow-md shadow-green-200 transition-colors cursor-pointer"
        >
          Analyze Property
        </button>
      </form>
    </div>
  );
}
