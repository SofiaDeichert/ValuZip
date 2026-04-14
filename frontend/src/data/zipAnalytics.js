import datasetUrl from './FINAL_DATASET_TEXAS.csv?url';
import ZIP_CITIES from './zip_cities.js';

const NUMERIC_FIELDS = new Set([
  'sale_price',
  'beds',
  'baths',
  'sqft',
  'zip_median_price',
  'tax_year',
  'tax_per_100k_p10',
  'tax_per_100k_p50',
  'tax_per_100k_p90',
  'eff_rate_p10',
  'eff_rate_p50',
  'eff_rate_p90',
]);

const analyticsPromiseByWindow = new Map();

function splitCsvLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}

function toNumber(value) {
  if (value == null) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

function toZipString(value) {
  if (value == null) return '';
  const raw = String(value).trim();
  if (!raw) return '';
  if (/^\d+$/.test(raw) && raw.length < 5) return raw.padStart(5, '0');
  return raw;
}

function toDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatMonthLabel(date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

function formatLastUpdated(date) {
  return new Intl.DateTimeFormat('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) return (sorted[mid - 1] + sorted[mid]) / 2;
  return sorted[mid];
}

function getDefaultZipAnalytics(zip) {
  return {
    zip,
    city: '',
    state: '',
    medianHomePrice: null,
    avgPricePerSqft: null,
    lastUpdated: '--/--/----',
    homePriceHistorical: [],
    homePriceForecast: [],
    sqftHistorical: [],
    sqftForecast: [],
  };
}

function parseRow(header, line) {
  const cols = splitCsvLine(line);
  if (cols.length < header.length) return null;

  const row = {};
  for (let i = 0; i < header.length; i += 1) {
    const key = header[i];
    const rawValue = cols[i] ?? '';

    if (key === 'zip_code') {
      row[key] = toZipString(rawValue);
    } else if (key === 'date') {
      row[key] = toDate(rawValue);
    } else if (NUMERIC_FIELDS.has(key)) {
      row[key] = toNumber(rawValue);
    } else {
      row[key] = rawValue ? String(rawValue).trim() : '';
    }
  }

  return row;
}

function loadAnalyticsMap() {
  const existing = analyticsPromiseByWindow.get('full');
  if (existing) return existing;

  const nextPromise = Promise.resolve().then(async () => {
    const lines = [];
    const text = await fetch(datasetUrl).then((res) => res.text());
    const rawLines = text.split(/\r?\n/);
    for (let i = 0; i < rawLines.length; i += 1) {
      if (rawLines[i]) lines.push(rawLines[i]);
    }
    if (!lines.length) return new Map();

    const header = splitCsvLine(lines[0]);
    const byZipMonth = new Map();

    for (let i = 1; i < lines.length; i += 1) {
      const row = parseRow(header, lines[i]);
      if (!row || !row.zip_code || !row.date) continue;

      const zip = row.zip_code;
      const monthKey = row.date.toISOString().slice(0, 7);
      const zipMap = byZipMonth.get(zip) ?? new Map();
      const bucket = zipMap.get(monthKey) ?? {
        date: row.date,
        city: row.city || '',
        state: row.state || '',
        zipMedianPrices: [],
        salePrices: [],
        pricePerSqftValues: [],
      };

      if (row.zip_median_price != null)
        bucket.zipMedianPrices.push(row.zip_median_price);
      if (row.sale_price != null) bucket.salePrices.push(row.sale_price);
      if (row.sale_price != null && row.sqft != null && row.sqft > 0) {
        bucket.pricePerSqftValues.push(row.sale_price / row.sqft);
      }

      zipMap.set(monthKey, bucket);
      byZipMonth.set(zip, zipMap);
    }

    const analyticsByZip = new Map();

    byZipMonth.forEach((months, zip) => {
      const monthBuckets = [...months.values()].sort((a, b) => a.date - b.date);
      if (!monthBuckets.length) return;

      const lastMonth = monthBuckets[monthBuckets.length - 1].date;

      // Store all monthly buckets — slicing to the requested window happens
      // at query time in getZipAnalytics so a single cache serves all toggles.
      analyticsByZip.set(zip, {
        zip,
        city: ZIP_CITIES[zip] || '',
        state: ZIP_CITIES[zip] ? 'TX' : '',
        lastUpdated: formatLastUpdated(lastMonth),
        allMonthBuckets: monthBuckets,
      });
    });

    return analyticsByZip;
  });

  analyticsPromiseByWindow.set('full', nextPromise);
  return nextPromise;
}

export async function getZipAnalytics(zip, options = {}) {
  const requestedYears = Number(options.timeRangeYears);
  const years =
    Number.isFinite(requestedYears) && requestedYears > 0 ? requestedYears : 3;

  const analyticsByZip = await loadAnalyticsMap();
  const raw = analyticsByZip.get(String(zip));
  if (!raw) return getDefaultZipAnalytics(String(zip));

  // Slice to the requested window at query time so the single cache serves all toggles
  const monthsToShow = years * 12;
  const sliced = raw.allMonthBuckets.slice(-monthsToShow);

  const homePriceHistorical = sliced
    .map((m) => ({
      date: formatMonthLabel(m.date),
      value: Math.round(median(m.zipMedianPrices) ?? median(m.salePrices) ?? 0),
    }))
    .filter((d) => d.value > 0);

  const sqftHistorical = sliced
    .map((m) => ({
      date: formatMonthLabel(m.date),
      value: Math.round(median(m.pricePerSqftValues) ?? 0),
    }))
    .filter((d) => d.value > 0);

  return {
    zip: raw.zip,
    city: raw.city,
    state: raw.state,
    lastUpdated: raw.lastUpdated,
    medianHomePrice: homePriceHistorical.at(-1)?.value ?? null,
    avgPricePerSqft: sqftHistorical.at(-1)?.value ?? null,
    homePriceHistorical,
    homePriceForecast: [],
    sqftHistorical,
    sqftForecast: [],
  };
}
