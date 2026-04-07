import loadRecent3yrData from './loadRecent3yrData';
import load10yrData from './load10yrData';

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

function getDateCutoff(years) {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  d.setHours(0, 0, 0, 0);
  return d;
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

function filterByTime(rows, cutoff) {
  return rows.filter((r) => r.date instanceof Date && r.date >= cutoff);
}

function filterZipTime(zipNorm, rows, cutoff) {
  return filterByTime(rows, cutoff).filter((r) => r.zip_code === zipNorm);
}

function applyStrictFilters(rows, form) {
  const minBed =
    form.bedrooms === '' || form.bedrooms == null ? null : Number(form.bedrooms);
  const minBath =
    form.bathrooms === '' || form.bathrooms == null ? null : Number(form.bathrooms);
  const minSq =
    form.minSqft === '' || form.minSqft == null ? null : Number(form.minSqft);
  const maxSq =
    form.maxSqft === '' || form.maxSqft == null ? null : Number(form.maxSqft);
  const minPrice =
    form.minPrice === '' || form.minPrice == null ? null : Number(form.minPrice);
  const maxPrice =
    form.maxPrice === '' || form.maxPrice == null ? null : Number(form.maxPrice);

  return rows.filter((r) => {
    if (!Number.isFinite(r.sale_price) || r.sale_price <= 0) return false;
    if (minBed != null && Number.isFinite(minBed) && (r.beds == null || r.beds < minBed))
      return false;
    if (minBath != null && Number.isFinite(minBath) && (r.baths == null || r.baths < minBath))
      return false;
    if (minSq != null && Number.isFinite(minSq) && minSq > 0 && (r.sqft == null || r.sqft < minSq))
      return false;
    if (maxSq != null && Number.isFinite(maxSq) && maxSq > 0 && (r.sqft == null || r.sqft > maxSq))
      return false;
    if (
      minPrice != null &&
      Number.isFinite(minPrice) &&
      minPrice > 0 &&
      r.sale_price < minPrice
    )
      return false;
    if (
      maxPrice != null &&
      Number.isFinite(maxPrice) &&
      maxPrice > 0 &&
      r.sale_price > maxPrice
    )
      return false;
    return true;
  });
}

function statsFromRows(comparables, zipLevelRows, targetSqft) {
  const prices = comparables
    .map((r) => r.sale_price)
    .filter((p) => Number.isFinite(p) && p > 0)
    .sort((a, b) => a - b);
  const medianPrice = medianSorted(prices);
  const minPriceBand = prices.length ? prices[0] : null;
  const maxPriceBand = prices.length ? prices[prices.length - 1] : null;

  const ppsfVals = comparables
    .filter((r) => Number.isFinite(r.sqft) && r.sqft > 0 && Number.isFinite(r.sale_price))
    .map((r) => r.sale_price / r.sqft);
  const avgPpsf = meanOfNumbers(ppsfVals);

  let sqftBasedEstimate = null;
  if (avgPpsf != null && targetSqft != null && targetSqft > 0) {
    sqftBasedEstimate = avgPpsf * targetSqft;
  }

  const zipMedians = zipLevelRows
    .map((r) => r.zip_median_price)
    .filter((z) => Number.isFinite(z) && z > 0);
  const zipMedianHomePrice = medianOfNumbers(zipMedians);

  let estimatedPoint = medianPrice;
  if (estimatedPoint == null && sqftBasedEstimate != null) estimatedPoint = sqftBasedEstimate;
  if (estimatedPoint == null && zipMedianHomePrice != null) estimatedPoint = zipMedianHomePrice;

  return {
    comparableCount: comparables.length,
    medianSalePrice: medianPrice,
    avgPricePerSqft: avgPpsf,
    priceBandLow: minPriceBand,
    priceBandHigh: maxPriceBand,
    sqftBasedEstimate,
    zipMedianHomePrice,
    estimatedPoint,
  };
}

async function loadRowsForTimeRange(years) {
  if (years <= 3) return loadRecent3yrData();
  return load10yrData();
}

/**
 * @param {object} form — shape aligned with PropertyForm `formData`
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

  const years = parseTimeRangeYears(form.timeRange);
  const cutoff = getDateCutoff(years);
  const rows = await loadRowsForTimeRange(years);
  const zipTimeRows = filterZipTime(zipNorm, rows, cutoff);

  if (!zipTimeRows.length) {
    return {
      ok: false,
      error: 'no_data',
      message: 'No comparable data found for this ZIP in the selected time range.',
      zip: zipNorm,
      timeRangeLabel: form.timeRange,
    };
  }

  const strictRows = applyStrictFilters(zipTimeRows, form);
  const usedFallback = strictRows.length < MIN_COMPARABLES;
  const comparables = usedFallback ? zipTimeRows : strictRows;

  const targetSqft = targetSqftFromForm(form);
  const stats = statsFromRows(comparables, zipTimeRows, targetSqft);

  const hasAnyPriceSignal =
    stats.medianSalePrice != null ||
    stats.zipMedianHomePrice != null ||
    stats.avgPricePerSqft != null;
  if (!hasAnyPriceSignal) {
    return {
      ok: false,
      error: 'no_data',
      message: 'No comparable data found (no usable sale prices in this ZIP for the selected window).',
      zip: zipNorm,
      timeRangeLabel: form.timeRange,
    };
  }

  const noteParts = [
    `Based on ${stats.comparableCount.toLocaleString('en-US')} comparable propert${
      stats.comparableCount === 1 ? 'y' : 'ies'
    } in ZIP ${zipNorm}`,
  ];
  if (usedFallback) {
    noteParts.push(
      'Using ZIP-level sales in this window (not enough rows matched all filters).',
    );
  }
  noteParts.push(`Using recent market data for ${form.timeRange.toLowerCase()}.`);

  return {
    ok: true,
    zip: zipNorm,
    timeRangeLabel: form.timeRange,
    usedFallback,
    ...stats,
    note: noteParts.join(' '),
  };
}
