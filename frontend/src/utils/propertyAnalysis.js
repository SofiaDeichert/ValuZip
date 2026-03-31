const MIN_COMPARABLES = 5;

export function parseTimeRangeYears(label) {
  const s = String(label || '').trim().toLowerCase();
  if (s.includes('10')) return 10;
  if (s.includes('5')) return 5;
  if (s.includes('3')) return 3;
  if (s.includes('1')) return 1;
  return 3;
}

function normalizeZip(zip) {
  const d = String(zip || '').replace(/\D/g, '').slice(0, 5);
  return d.length === 5 ? d : '';
}

function medianSorted(sorted) {
  if (!sorted.length) return null;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function medianOfNumbers(values) {
  const nums = values.filter((n) => Number.isFinite(n) && n > 0);
  if (!nums.length) return null;
  return medianSorted([...nums].sort((a, b) => a - b));
}

function meanOfNumbers(values) {
  const nums = values.filter((n) => Number.isFinite(n));
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function targetSqftFromForm(form) {
  const minS = form.minSqft === '' || form.minSqft == null ? null : Number(form.minSqft);
  const maxS = form.maxSqft === '' || form.maxSqft == null ? null : Number(form.maxSqft);
  const hasMin = Number.isFinite(minS) && minS > 0;
  const hasMax = Number.isFinite(maxS) && maxS > 0;
  if (hasMin && hasMax) return (minS + maxS) / 2;
  if (hasMin) return minS;
  if (hasMax) return maxS;
  const single = form.sqft === '' || form.sqft == null ? null : Number(form.sqft);
  if (Number.isFinite(single) && single > 0) return single;
  return null;
}

/**
 * @param {object} form
 * @returns {Promise<object>}
 */
export async function runPropertyAnalysis(form) {
  const zipNorm = normalizeZip(form.zip);

  if (!zipNorm || zipNorm.length !== 5) {
    return {
      ok: false,
      error: 'validation',
      message: 'Enter a 5-digit ZIP code to run analysis.',
    };
  }

  const params = new URLSearchParams();
  params.append('zip', zipNorm);

  if (form.bedrooms !== '' && form.bedrooms != null) {
    params.append('bedrooms', form.bedrooms);
  }
  if (form.bathrooms !== '' && form.bathrooms != null) {
    params.append('bathrooms', form.bathrooms);
  }
  if (form.minPrice !== '' && form.minPrice != null) {
    params.append('minPrice', form.minPrice);
  }
  if (form.maxPrice !== '' && form.maxPrice != null) {
    params.append('maxPrice', form.maxPrice);
  }

  const response = await fetch(
    `http://127.0.0.1:8000/api/properties?${params.toString()}`
  );
  const data = await response.json();

  if (!data.results || data.results.length < MIN_COMPARABLES) {
    return {
      ok: false,
      error: 'no_data',
      message: 'No comparable data found for this ZIP in the selected filters.',
      zip: zipNorm,
      timeRangeLabel: form.timeRange,
    };
  }

  const prices = data.results
    .map((row) => Number(row.sale_price))
    .filter((v) => Number.isFinite(v) && v > 0)
    .sort((a, b) => a - b);

  const ppsfVals = data.results
    .filter((row) => Number(row.sale_price) > 0 && Number(row.sqft) > 0)
    .map((row) => Number(row.sale_price) / Number(row.sqft));

  const zipMedians = data.results
    .map((row) => Number(row.zip_median_price))
    .filter((v) => Number.isFinite(v) && v > 0);

  const medianSalePrice = medianSorted(prices);
  const avgPricePerSqft = meanOfNumbers(ppsfVals);
  const zipMedianHomePrice = medianOfNumbers(zipMedians);

  const minPriceBand = prices.length ? prices[0] : null;
  const maxPriceBand = prices.length ? prices[prices.length - 1] : null;

  const targetSqft = targetSqftFromForm(form);
  let sqftBasedEstimate = null;
  if (avgPricePerSqft != null && targetSqft != null && targetSqft > 0) {
    sqftBasedEstimate = avgPricePerSqft * targetSqft;
  }

  let estimatedPoint = medianSalePrice;
  if (estimatedPoint == null && sqftBasedEstimate != null) estimatedPoint = sqftBasedEstimate;
  if (estimatedPoint == null && zipMedianHomePrice != null) estimatedPoint = zipMedianHomePrice;

  const hasAnyPriceSignal =
    medianSalePrice != null || zipMedianHomePrice != null || avgPricePerSqft != null;

  if (!hasAnyPriceSignal) {
    return {
      ok: false,
      error: 'no_data',
      message: 'No comparable data found (no usable sale prices in this ZIP for the selected filters).',
      zip: zipNorm,
      timeRangeLabel: form.timeRange,
    };
  }

  return {
    ok: true,
    zip: zipNorm,
    timeRangeLabel: form.timeRange,
    usedFallback: false,
    comparableCount: data.count,
    medianSalePrice,
    avgPricePerSqft,
    priceBandLow: minPriceBand,
    priceBandHigh: maxPriceBand,
    sqftBasedEstimate,
    zipMedianHomePrice,
    estimatedPoint,
    note: `Based on ${Number(data.count).toLocaleString('en-US')} comparable properties in ZIP ${zipNorm}.`,
  };
}