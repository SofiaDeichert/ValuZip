import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import geojsonUrl from '../data/dallas-zips.geojson?url';
import DATASET_ZIPS from '../utils/datasetZips';

export default function ZipSelect({ currentZip, className = '', style = {} }) {
  const navigate = useNavigate();
  const [zipCodes, setZipCodes] = useState([]);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const inputRef = useRef(null);
  const menuRef = useRef(null);
  const containerRef = useRef(null);

  // Fetch + cache ZIP list once, filtered to only ZIPs with dataset data
  useEffect(() => {
    fetch(geojsonUrl)
      .then((r) => r.json())
      .then((data) => {
        const zips = data.features
          .map((f) => String(f.properties.ZipCode))
          .filter((z) => DATASET_ZIPS.has(Number(z)))
          .sort();
        setZipCodes(zips);
      });
  }, []);

  // Click-outside → close
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = query.trim()
    ? zipCodes.filter((z) => z.startsWith(query.trim()))
    : zipCodes;

  const handleSelect = (zip) => {
    setQuery('');
    setOpen(false);
    navigate(`/zip/${zip}`);
  };

  const handleKeyDown = (e) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') setOpen(true);
      return;
    }
    if (e.key === 'ArrowDown') {
      setHighlighted((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      if (filtered[highlighted]) handleSelect(filtered[highlighted]);
    } else if (e.key === 'Escape') {
      setOpen(false);
      setQuery('');
    }
  };

  // Keep highlighted item scrolled into view
  useEffect(() => {
    if (!menuRef.current) return;
    const item = menuRef.current.children[highlighted];
    if (item) item.scrollIntoView({ block: 'nearest' });
  }, [highlighted]);

  // Reset highlight when filter changes
  useEffect(() => {
    setHighlighted(0);
  }, [query]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: 'relative', minWidth: 210, ...style }}
    >
      {/* ── Trigger / Input ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          backgroundColor: '#ffffff',
          border: open ? '1.5px solid #006400' : '1.5px solid #d1d5db',
          borderRadius: 10,
          padding: '0 12px',
          height: 40,
          boxShadow: open
            ? '0 0 0 3px rgba(0,100,0,0.13)'
            : '0 1px 3px rgba(0,0,0,0.06)',
          transition: 'border 0.15s, box-shadow 0.15s',
          cursor: 'text',
        }}
        onClick={() => {
          setOpen(true);
          inputRef.current?.focus();
        }}
      >
        {/* Search icon */}
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          style={{
            flexShrink: 0,
            color: open ? '#006400' : '#9ca3af',
            transition: 'color 0.15s',
          }}
        >
          <circle
            cx="6"
            cy="6"
            r="4.2"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path
            d="M9.5 9.5L12.5 12.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={currentZip ? `ZIP: ${currentZip}` : 'Search ZIP…'}
          style={{
            border: 'none',
            outline: 'none',
            fontSize: 13,
            fontWeight: 600,
            color: '#111827',
            background: 'transparent',
            width: '100%',
            letterSpacing: '0.02em',
          }}
        />

        {/* Chevron */}
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          style={{
            flexShrink: 0,
            color: '#9ca3af',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }}
        >
          <path
            d="M2 4L6 8L10 4"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* ── Dropdown ── */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 5px)',
            left: 0,
            right: 0,
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            boxShadow: '0 10px 32px rgba(0,0,0,0.11)',
            zIndex: 9999,
            overflow: 'hidden',
          }}
        >
          {filtered.length === 0 ? (
            <div
              style={{
                padding: '12px 14px',
                fontSize: 13,
                color: '#9ca3af',
                textAlign: 'center',
              }}
            >
              No matching ZIP codes
            </div>
          ) : (
            <div
              ref={menuRef}
              style={{ maxHeight: 236, overflowY: 'auto', padding: 4 }}
            >
              {filtered.map((zip, i) => {
                const isCurrent = zip === currentZip;
                const isHovered = i === highlighted;
                return (
                  <div
                    key={zip}
                    onMouseDown={() => handleSelect(zip)}
                    onMouseEnter={() => setHighlighted(i)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: isCurrent ? 700 : 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor:
                        isHovered || isCurrent
                          ? 'rgba(0,100,0,0.08)'
                          : 'transparent',
                      color: isCurrent ? '#006400' : '#111827',
                      transition: 'background 0.08s',
                    }}
                  >
                    <span>{zip}</span>
                    {isCurrent && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: '#006400',
                          backgroundColor: 'rgba(0,100,0,0.14)',
                          borderRadius: 99,
                          padding: '2px 8px',
                          letterSpacing: '0.05em',
                          textTransform: 'uppercase',
                        }}
                      >
                        Current
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
