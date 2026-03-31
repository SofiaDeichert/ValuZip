import datasetUrl from '../data/final_recent_3yrs.csv?url';

const NUMERIC_FIELDS = new Set([
  'sale_price',
  'beds',
  'baths',
  'sqft',
  'zip_median_price',
  'tax_year',
]);

let parsedPromise;

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

function isTaxRelatedField(fieldName) {
  return fieldName.includes('tax') || fieldName.includes('eff_rate');
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
    } else if (NUMERIC_FIELDS.has(key) || isTaxRelatedField(key)) {
      row[key] = toNumber(rawValue);
    } else {
      row[key] = rawValue ? String(rawValue).trim() : '';
    }
  }

  return row;
}

export function loadRecent3yrData() {
  if (parsedPromise) return parsedPromise;

  parsedPromise = Promise.resolve().then(async () => {
    const text = await fetch(datasetUrl).then((res) => res.text());
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (!lines.length) return [];

    const header = splitCsvLine(lines[0]);
    const rows = [];

    for (let i = 1; i < lines.length; i += 1) {
      const parsed = parseRow(header, lines[i]);
      if (parsed) rows.push(parsed);
    }

    return rows;
  });

  return parsedPromise;
}

export default loadRecent3yrData;
