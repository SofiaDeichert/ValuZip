// import { useEffect, useRef, useState } from 'react';

// const SQFT_MIN = 500;
// const SQFT_MAX = 10000;

// const BED_OPTIONS = [1, 2, 3, 4, 5, 6];
// const BATH_OPTIONS = [1, 2, 3, 4, 5, 6];

// export default function PropertyForm({ selectedZip, setSelectedZip }) {
//   const defaultFormData = {
//     zip: '',
//     bedrooms: '',
//     bathrooms: '',
//     sqft: '',
//   };

//   const [formData, setFormData] = useState({
//     ...defaultFormData,
//     zip: selectedZip || '',
//   });
//   const [isBedsBathsOpen, setIsBedsBathsOpen] = useState(false);
//   const [isSqftOpen, setIsSqftOpen] = useState(false);
//   const [pendingBedsBaths, setPendingBedsBaths] = useState({
//     bedrooms: '',
//     bathrooms: '',
//   });
//   const [pendingSqft, setPendingSqft] = useState('');
//   const [sqftError, setSqftError] = useState('');
//   const [submitError, setSubmitError] = useState(null);
//   const [analysisLoading, setAnalysisLoading] = useState(false);
//   const [predictionResult, setPredictionResult] = useState(null);

//   const bedsBathsRef = useRef(null);
//   const sqftRef = useRef(null);

//   const sanitizeZipInput = (value) => value.replace(/\D/g, '').slice(0, 5);

//   // ── Label helpers ──────────────────────────────────────────────
//   const getBedsBathsLabel = () => {
//     const { bedrooms, bathrooms } = formData;
//     if (!bedrooms && !bathrooms) return 'Beds & Baths';
//     if (bedrooms && bathrooms) return `${bedrooms} bd · ${bathrooms} ba`;
//     if (bedrooms) return `${bedrooms} bd`;
//     return `${bathrooms} ba`;
//   };

//   const getSqftLabel = () => {
//     if (!formData.sqft) return 'Sq Ft';
//     return `${Number(formData.sqft).toLocaleString()} sqft`;
//   };

//   // ── Active flags ───────────────────────────────────────────────
//   const isZipActive = Boolean(String(formData.zip || '').trim());
//   const isBedsBathsActive = Boolean(formData.bedrooms || formData.bathrooms);
//   const isSqftActive = Boolean(formData.sqft);
//   const hasAnyActiveFilters = isZipActive || isBedsBathsActive || isSqftActive;

//   // ── Styling helpers ────────────────────────────────────────────
//   const filterControlTransition =
//     'transition-[border-color,box-shadow,background-color] duration-200 ease-out';

//   const getFilterControlClass = (isActive) =>
//     `h-12 w-full rounded-lg border bg-white px-4 text-left text-gray-900 outline-none ${filterControlTransition} ${
//       isActive
//         ? 'border-[#006400]/45 bg-[#006400]/[0.04] shadow-[inset_0_0_0_1px_rgba(0,100,0,0.05)] hover:border-[#006400]/55 hover:shadow-[inset_0_0_0_1px_rgba(0,100,0,0.07),0_1px_2px_rgba(15,23,42,0.04)]'
//         : 'border-gray-200/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] hover:border-gray-300 hover:shadow-[0_1px_2px_rgba(15,23,42,0.05),inset_0_0_0_1px_rgba(15,23,42,0.03)]'
//     } focus-visible:border-[#006400] focus-visible:ring-2 focus-visible:ring-[#006400]/22 focus-visible:ring-offset-0`;

//   const getFilterValueClass = (isActive) =>
//     `block truncate text-base ${isActive ? 'font-bold text-gray-950' : 'font-semibold text-gray-900'}`;

//   const pickerBtnClass = (selected) =>
//     `h-9 w-10 rounded-md text-[13px] font-semibold transition ${
//       selected
//         ? 'bg-[#006400] text-white shadow-sm'
//         : 'border border-gray-300 bg-white text-gray-700 hover:border-[#006400]/60 hover:text-[#006400]'
//     }`;

//   // ── Apply handlers ─────────────────────────────────────────────
//   const applyBedsBaths = () => {
//     setFormData((prev) => ({
//       ...prev,
//       bedrooms: pendingBedsBaths.bedrooms,
//       bathrooms: pendingBedsBaths.bathrooms,
//     }));
//     setIsBedsBathsOpen(false);
//   };

//   const applySqft = () => {
//     const val = Number(pendingSqft);
//     if (
//       pendingSqft !== '' &&
//       (!Number.isFinite(val) || val < SQFT_MIN || val > SQFT_MAX)
//     ) {
//       setSqftError(
//         `Enter a value between ${SQFT_MIN.toLocaleString()} and ${SQFT_MAX.toLocaleString()} sqft`,
//       );
//       return;
//     }
//     setSqftError('');
//     setFormData((prev) => ({ ...prev, sqft: pendingSqft === '' ? '' : val }));
//     setIsSqftOpen(false);
//   };

//   // ── Click-outside handlers ─────────────────────────────────────
//   useEffect(() => {
//     if (!isBedsBathsOpen) return;
//     const handler = (e) => {
//       if (bedsBathsRef.current && !bedsBathsRef.current.contains(e.target))
//         setIsBedsBathsOpen(false);
//     };
//     document.addEventListener('mousedown', handler);
//     return () => document.removeEventListener('mousedown', handler);
//   }, [isBedsBathsOpen]);

//   useEffect(() => {
//     if (!isSqftOpen) return;
//     const handler = (e) => {
//       if (sqftRef.current && !sqftRef.current.contains(e.target)) {
//         setSqftError('');
//         setIsSqftOpen(false);
//       }
//     };
//     document.addEventListener('mousedown', handler);
//     return () => document.removeEventListener('mousedown', handler);
//   }, [isSqftOpen]);

//   useEffect(() => {
//     setFormData((prev) => ({ ...prev, zip: selectedZip || '' }));
//   }, [selectedZip]);

//   // ── Form handlers ──────────────────────────────────────────────
//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     if (name === 'zip') {
//       const sanitized = sanitizeZipInput(value);
//       setFormData((prev) => ({ ...prev, zip: sanitized }));
//       setSelectedZip(sanitized);
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setSubmitError(null);
//     setPredictionResult(null);
//     setAnalysisLoading(true);

//     try {
//       if (!formData.zip || String(formData.zip).length !== 5) {
//         setSubmitError('Please enter a valid 5-digit ZIP code.');
//         return;
//       }

//       const payload = {
//         zip_code: String(formData.zip),
//         beds: Number(formData.bedrooms) || 0,
//         baths: Number(formData.bathrooms) || 0,
//         sqft: Number(formData.sqft) || 0,
//         year: new Date().getFullYear(),
//         month: new Date().getMonth() + 1,
//       };

//       const response = await fetch('http://127.0.0.1:8000/predict', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(payload),
//       });

//       const data = await response.json();
//       if (!response.ok) throw new Error('Prediction failed');
//       setPredictionResult(data);
//     } catch {
//       setSubmitError(
//         'Could not get prediction from backend. Check that the backend is running.',
//       );
//     } finally {
//       setAnalysisLoading(false);
//     }
//   };

//   const handleClearAll = () => {
//     setFormData(defaultFormData);
//     setPendingBedsBaths({ bedrooms: '', bathrooms: '' });
//     setPendingSqft('');
//     setSqftError('');
//     setIsBedsBathsOpen(false);
//     setIsSqftOpen(false);
//     setSelectedZip('');
//     setSubmitError(null);
//     setPredictionResult(null);
//   };

//   // ── Render ─────────────────────────────────────────────────────
//   return (
//     <form onSubmit={handleSubmit} className="w-full">
//       <div className="rounded-lg border border-gray-200/90 bg-gray-50/90 px-4 py-3.5 shadow-[0_5px_16px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.65)]">
//         <div className="flex flex-wrap items-center gap-3">
//           {/* ── ZIP Code ── */}
//           <div className="min-w-[160px] flex-1">
//             <div className="relative">
//               <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
//                 <svg
//                   className="h-4 w-4 opacity-90"
//                   viewBox="0 0 20 20"
//                   fill="none"
//                   aria-hidden="true"
//                 >
//                   <path
//                     d="m14 14 3.5 3.5M9 15.5a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13Z"
//                     stroke="currentColor"
//                     strokeWidth="1.6"
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                   />
//                 </svg>
//               </div>
//               <label className="pointer-events-none absolute left-10 top-[6px] text-[11px] font-semibold uppercase tracking-wide text-gray-500">
//                 ZIP Code
//               </label>
//               <input
//                 type="text"
//                 inputMode="numeric"
//                 name="zip"
//                 autoComplete="postal-code"
//                 maxLength={5}
//                 value={formData.zip}
//                 onChange={handleChange}
//                 placeholder="e.g. 75201"
//                 aria-label="ZIP code, 5 digits"
//                 className={`h-12 w-full rounded-lg border pl-10 pr-4 pb-[8px] pt-4.5 text-base tabular-nums tracking-wide text-gray-900 outline-none placeholder:text-gray-400 ${filterControlTransition} ${
//                   isZipActive
//                     ? 'border-[#006400]/45 bg-[#006400]/[0.04] font-bold text-gray-950 shadow-[inset_0_0_0_1px_rgba(0,100,0,0.05)] hover:border-[#006400]/55'
//                     : 'border-gray-200/95 bg-white font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] hover:border-gray-300'
//                 } focus-visible:border-[#006400] focus-visible:ring-2 focus-visible:ring-[#006400]/22 focus-visible:ring-offset-0`}
//               />
//             </div>
//           </div>

//           {/* ── Beds & Baths ── */}
//           <div ref={bedsBathsRef} className="relative min-w-[180px] flex-1">
//             <button
//               type="button"
//               onClick={() => {
//                 setPendingBedsBaths({
//                   bedrooms: formData.bedrooms,
//                   bathrooms: formData.bathrooms,
//                 });
//                 setIsBedsBathsOpen((prev) => !prev);
//               }}
//               className={getFilterControlClass(isBedsBathsActive)}
//             >
//               <span className="flex items-center justify-between gap-3">
//                 <span className="min-w-0">
//                   <span className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
//                     Beds & Baths
//                   </span>
//                   <span className={getFilterValueClass(isBedsBathsActive)}>
//                     {getBedsBathsLabel()}
//                   </span>
//                 </span>
//                 <svg
//                   className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${isBedsBathsOpen ? 'rotate-180' : ''}`}
//                   viewBox="0 0 20 20"
//                   fill="none"
//                   aria-hidden="true"
//                 >
//                   <path
//                     d="m5 7.5 5 5 5-5"
//                     stroke="currentColor"
//                     strokeWidth="1.6"
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                   />
//                 </svg>
//               </span>
//             </button>

//             {isBedsBathsOpen && (
//               <div className="absolute left-0 top-[calc(100%+10px)] z-20 w-[280px] rounded-lg border border-gray-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.14)]">
//                 {/* Bedrooms */}
//                 <div className="mb-5">
//                   <p className="mb-2.5 text-[13px] font-semibold uppercase tracking-wide text-gray-600">
//                     Bedrooms
//                   </p>
//                   <div className="flex gap-2">
//                     {BED_OPTIONS.map((n) => (
//                       <button
//                         key={n}
//                         type="button"
//                         onClick={() =>
//                           setPendingBedsBaths((prev) => ({
//                             ...prev,
//                             bedrooms: String(n),
//                           }))
//                         }
//                         className={pickerBtnClass(
//                           pendingBedsBaths.bedrooms === String(n),
//                         )}
//                       >
//                         {n}
//                       </button>
//                     ))}
//                   </div>
//                   <p className="mt-2 text-xs text-gray-400">
//                     Select exact number of bedrooms
//                   </p>
//                 </div>

//                 {/* Bathrooms */}
//                 <div>
//                   <p className="mb-2.5 text-[13px] font-semibold uppercase tracking-wide text-gray-600">
//                     Bathrooms
//                   </p>
//                   <div className="flex gap-2">
//                     {BATH_OPTIONS.map((n) => (
//                       <button
//                         key={n}
//                         type="button"
//                         onClick={() =>
//                           setPendingBedsBaths((prev) => ({
//                             ...prev,
//                             bathrooms: String(n),
//                           }))
//                         }
//                         className={pickerBtnClass(
//                           pendingBedsBaths.bathrooms === String(n),
//                         )}
//                       >
//                         {n}
//                       </button>
//                     ))}
//                   </div>
//                   <p className="mt-2 text-xs text-gray-400">
//                     Select exact number of bathrooms
//                   </p>
//                 </div>

//                 <div className="mt-5 flex items-center justify-between">
//                   <button
//                     type="button"
//                     onClick={() =>
//                       setPendingBedsBaths({ bedrooms: '', bathrooms: '' })
//                     }
//                     className="text-sm font-semibold text-gray-500 transition hover:text-gray-700"
//                   >
//                     Clear
//                   </button>
//                   <button
//                     type="button"
//                     onClick={applyBedsBaths}
//                     className="h-9 rounded-md bg-[#006400] px-5 text-[13px] font-semibold text-white transition-shadow hover:shadow-[inset_0_0_0_9999px_rgba(0,0,0,0.12)] active:shadow-[inset_0_0_0_9999px_rgba(0,0,0,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006400]/30 focus-visible:ring-offset-2"
//                   >
//                     Apply
//                   </button>
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* ── Square Footage ── */}
//           <div ref={sqftRef} className="relative min-w-[160px] flex-1">
//             <button
//               type="button"
//               onClick={() => {
//                 setPendingSqft(
//                   formData.sqft !== '' ? String(formData.sqft) : '',
//                 );
//                 setSqftError('');
//                 setIsSqftOpen((prev) => !prev);
//               }}
//               className={getFilterControlClass(isSqftActive)}
//             >
//               <span className="flex items-center justify-between gap-3">
//                 <span className="min-w-0">
//                   <span className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
//                     Square Footage
//                   </span>
//                   <span className={getFilterValueClass(isSqftActive)}>
//                     {getSqftLabel()}
//                   </span>
//                 </span>
//                 <svg
//                   className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${isSqftOpen ? 'rotate-180' : ''}`}
//                   viewBox="0 0 20 20"
//                   fill="none"
//                   aria-hidden="true"
//                 >
//                   <path
//                     d="m5 7.5 5 5 5-5"
//                     stroke="currentColor"
//                     strokeWidth="1.6"
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                   />
//                 </svg>
//               </span>
//             </button>

//             {isSqftOpen && (
//               <div className="absolute left-0 top-[calc(100%+10px)] z-20 w-[280px] rounded-lg border border-gray-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.14)]">
//                 <p className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-gray-600">
//                   Square Footage
//                 </p>

//                 <div className="relative">
//                   <input
//                     type="text"
//                     inputMode="numeric"
//                     value={pendingSqft}
//                     onChange={(e) => {
//                       const digits = e.target.value.replace(/[^\d]/g, '');
//                       setPendingSqft(digits);
//                       setSqftError('');
//                     }}
//                     onKeyDown={(e) => {
//                       if (e.key === 'Enter') {
//                         e.preventDefault();
//                         applySqft();
//                       }
//                     }}
//                     placeholder="e.g. 2000"
//                     className={`h-11 w-full rounded-md border px-3.5 pr-14 text-[15px] text-gray-900 outline-none transition-all ${
//                       sqftError
//                         ? 'border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-400/20'
//                         : 'border-gray-300 bg-gray-50/40 focus:border-[#006400] focus:ring-2 focus:ring-[#006400]/20'
//                     }`}
//                   />
//                   <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">
//                     sqft
//                   </span>
//                 </div>

//                 {sqftError ? (
//                   <p className="mt-1.5 text-xs font-medium text-red-500">
//                     {sqftError}
//                   </p>
//                 ) : (
//                   <p className="mt-1.5 text-xs text-gray-400">
//                     Valid range: {SQFT_MIN.toLocaleString()}–
//                     {SQFT_MAX.toLocaleString()} sqft
//                   </p>
//                 )}

//                 {/* Common sizes */}
//                 <div className="mt-4">
//                   <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
//                     Common sizes
//                   </p>
//                   <div className="flex flex-wrap gap-2">
//                     {[800, 1200, 1500, 2000, 2500, 3000, 4000].map((v) => (
//                       <button
//                         key={v}
//                         type="button"
//                         onClick={() => {
//                           setPendingSqft(String(v));
//                           setSqftError('');
//                         }}
//                         className={`h-8 rounded-md px-3 text-xs font-semibold transition ${
//                           pendingSqft === String(v)
//                             ? 'bg-[#006400] text-white'
//                             : 'border border-gray-300 bg-white text-gray-600 hover:border-[#006400]/60 hover:text-[#006400]'
//                         }`}
//                       >
//                         {v.toLocaleString()}
//                       </button>
//                     ))}
//                   </div>
//                 </div>

//                 <div className="mt-5 flex items-center justify-between">
//                   <button
//                     type="button"
//                     onClick={() => {
//                       setPendingSqft('');
//                       setSqftError('');
//                     }}
//                     className="text-sm font-semibold text-gray-500 transition hover:text-gray-700"
//                   >
//                     Clear
//                   </button>
//                   <button
//                     type="button"
//                     onClick={applySqft}
//                     className="h-9 rounded-md bg-[#006400] px-5 text-[13px] font-semibold text-white transition-shadow hover:shadow-[inset_0_0_0_9999px_rgba(0,0,0,0.12)] active:shadow-[inset_0_0_0_9999px_rgba(0,0,0,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006400]/30 focus-visible:ring-offset-2"
//                   >
//                     Apply
//                   </button>
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* ── Clear All ── */}
//           <button
//             type="button"
//             onClick={handleClearAll}
//             className={`h-12 rounded-md px-2 text-sm font-semibold transition-[color,background-color,box-shadow] duration-200 ease-out ${
//               hasAnyActiveFilters
//                 ? 'text-gray-600 hover:bg-gray-100/85 hover:text-gray-800 active:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400/35 focus-visible:ring-offset-2'
//                 : 'cursor-default text-gray-400'
//             }`}
//             disabled={!hasAnyActiveFilters}
//             aria-label="Clear all filters"
//           >
//             Clear all
//           </button>

//           {/* ── Analyze Property ── */}
//           <button
//             type="submit"
//             disabled={analysisLoading}
//             className="h-12 min-w-[170px] rounded-lg bg-[#006400] px-5 text-base font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.12)] transition-[box-shadow,transform,filter] duration-200 ease-out hover:shadow-[0_2px_6px_rgba(0,0,0,0.14),inset_0_0_0_9999px_rgba(0,0,0,0.06)] active:translate-y-px active:shadow-[0_1px_2px_rgba(0,0,0,0.14),inset_0_0_0_9999px_rgba(0,0,0,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006400]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:pointer-events-none disabled:opacity-60"
//           >
//             {analysisLoading ? 'Analyzing…' : 'Analyze Property'}
//           </button>
//         </div>

//         {submitError && (
//           <p className="mt-2 text-sm font-medium text-amber-800" role="alert">
//             {submitError}
//           </p>
//         )}

//         {predictionResult && (
//           <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4">
//             <p className="text-lg font-semibold text-green-800">
//               Predicted Price: $
//               {Number(predictionResult.predicted_price).toLocaleString()}
//             </p>
//             <p className="mt-1 text-sm text-green-700">
//               ZIP: {predictionResult.zip_code} · Beds: {predictionResult.beds} ·
//               Baths: {predictionResult.baths} · Sq Ft:{' '}
//               {Number(predictionResult.sqft).toLocaleString()}
//             </p>
//           </div>
//         )}
//       </div>
//     </form>
//   );
// }
// import { useEffect, useRef, useState } from 'react';
// import { useNavigate } from 'react-router-dom';

// const SQFT_MIN = 500;
// const SQFT_MAX = 10000;

// const BED_OPTIONS = [1, 2, 3, 4, 5, 6];
// const BATH_OPTIONS = [1, 2, 3, 4, 5, 6];

// export default function PropertyForm({ selectedZip, setSelectedZip }) {
//   const navigate = useNavigate();

//   const defaultFormData = {
//     zip: '',
//     bedrooms: '',
//     bathrooms: '',
//     sqft: '',
//   };

//   const [formData, setFormData] = useState({
//     ...defaultFormData,
//     zip: selectedZip || '',
//   });
//   const [isBedsBathsOpen, setIsBedsBathsOpen] = useState(false);
//   const [isSqftOpen, setIsSqftOpen] = useState(false);
//   const [pendingBedsBaths, setPendingBedsBaths] = useState({
//     bedrooms: '',
//     bathrooms: '',
//   });
//   const [pendingSqft, setPendingSqft] = useState('');
//   const [sqftError, setSqftError] = useState('');
//   const [submitError, setSubmitError] = useState(null);
//   const [analysisLoading, setAnalysisLoading] = useState(false);

//   const bedsBathsRef = useRef(null);
//   const sqftRef = useRef(null);

//   const sanitizeZipInput = (value) => value.replace(/\D/g, '').slice(0, 5);

//   // ── Label helpers ──────────────────────────────────────────────
//   const getBedsBathsLabel = () => {
//     const { bedrooms, bathrooms } = formData;
//     if (!bedrooms && !bathrooms) return 'Beds & Baths';
//     if (bedrooms && bathrooms) return `${bedrooms} bd · ${bathrooms} ba`;
//     if (bedrooms) return `${bedrooms} bd`;
//     return `${bathrooms} ba`;
//   };

//   const getSqftLabel = () => {
//     if (!formData.sqft) return 'Sq Ft';
//     return `${Number(formData.sqft).toLocaleString()} sqft`;
//   };

//   // ── Active flags ───────────────────────────────────────────────
//   const isZipActive = Boolean(String(formData.zip || '').trim());
//   const isBedsBathsActive = Boolean(formData.bedrooms || formData.bathrooms);
//   const isSqftActive = Boolean(formData.sqft);
//   const hasAnyActiveFilters = isZipActive || isBedsBathsActive || isSqftActive;

//   // ── Styling helpers ────────────────────────────────────────────
//   const filterControlTransition =
//     'transition-[border-color,box-shadow,background-color] duration-200 ease-out';

//   const getFilterControlClass = (isActive) =>
//     `h-12 w-full rounded-lg border bg-white px-4 text-left text-gray-900 outline-none ${filterControlTransition} ${
//       isActive
//         ? 'border-[#006400]/45 bg-[#006400]/[0.04] shadow-[inset_0_0_0_1px_rgba(0,100,0,0.05)] hover:border-[#006400]/55 hover:shadow-[inset_0_0_0_1px_rgba(0,100,0,0.07),0_1px_2px_rgba(15,23,42,0.04)]'
//         : 'border-gray-200/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] hover:border-gray-300 hover:shadow-[0_1px_2px_rgba(15,23,42,0.05),inset_0_0_0_1px_rgba(15,23,42,0.03)]'
//     } focus-visible:border-[#006400] focus-visible:ring-2 focus-visible:ring-[#006400]/22 focus-visible:ring-offset-0`;

//   const getFilterValueClass = (isActive) =>
//     `block truncate text-base ${isActive ? 'font-bold text-gray-950' : 'font-semibold text-gray-900'}`;

//   const pickerBtnClass = (selected) =>
//     `h-9 w-10 rounded-md text-[13px] font-semibold transition ${
//       selected
//         ? 'bg-[#006400] text-white shadow-sm'
//         : 'border border-gray-300 bg-white text-gray-700 hover:border-[#006400]/60 hover:text-[#006400]'
//     }`;

//   // ── Apply handlers ─────────────────────────────────────────────
//   const applyBedsBaths = () => {
//     setFormData((prev) => ({
//       ...prev,
//       bedrooms: pendingBedsBaths.bedrooms,
//       bathrooms: pendingBedsBaths.bathrooms,
//     }));
//     setIsBedsBathsOpen(false);
//   };

//   const applySqft = () => {
//     const val = Number(pendingSqft);
//     if (
//       pendingSqft !== '' &&
//       (!Number.isFinite(val) || val < SQFT_MIN || val > SQFT_MAX)
//     ) {
//       setSqftError(
//         `Enter a value between ${SQFT_MIN.toLocaleString()} and ${SQFT_MAX.toLocaleString()} sqft`,
//       );
//       return;
//     }
//     setSqftError('');
//     setFormData((prev) => ({ ...prev, sqft: pendingSqft === '' ? '' : val }));
//     setIsSqftOpen(false);
//   };

//   // ── Click-outside handlers ─────────────────────────────────────
//   useEffect(() => {
//     if (!isBedsBathsOpen) return;
//     const handler = (e) => {
//       if (bedsBathsRef.current && !bedsBathsRef.current.contains(e.target))
//         setIsBedsBathsOpen(false);
//     };
//     document.addEventListener('mousedown', handler);
//     return () => document.removeEventListener('mousedown', handler);
//   }, [isBedsBathsOpen]);

//   useEffect(() => {
//     if (!isSqftOpen) return;
//     const handler = (e) => {
//       if (sqftRef.current && !sqftRef.current.contains(e.target)) {
//         setSqftError('');
//         setIsSqftOpen(false);
//       }
//     };
//     document.addEventListener('mousedown', handler);
//     return () => document.removeEventListener('mousedown', handler);
//   }, [isSqftOpen]);

//   useEffect(() => {
//     setFormData((prev) => ({ ...prev, zip: selectedZip || '' }));
//   }, [selectedZip]);

//   // ── Form handlers ──────────────────────────────────────────────
//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     if (name === 'zip') {
//       const sanitized = sanitizeZipInput(value);
//       setFormData((prev) => ({ ...prev, zip: sanitized }));
//       setSelectedZip(sanitized);
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setSubmitError(null);
//     setAnalysisLoading(true);

//     try {
//       if (!formData.zip || String(formData.zip).length !== 5) {
//         setSubmitError('Please enter a valid 5-digit ZIP code.');
//         return;
//       }

//       const payload = {
//         zip_code: String(formData.zip),
//         beds: Number(formData.bedrooms) || 0,
//         baths: Number(formData.bathrooms) || 0,
//         sqft: Number(formData.sqft) || 0,
//         year: new Date().getFullYear(),
//         month: new Date().getMonth() + 1,
//       };

//       const response = await fetch('http://127.0.0.1:8000/predict', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(payload),
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         // Surface the backend's error message if available
//         const detail = data?.detail || 'Prediction failed.';
//         setSubmitError(detail);
//         return;
//       }

//       // Navigate to the ZIP detail page, passing the full prediction result
//       // via router state so ZipDetailPage can display it in the sidebar
//       navigate(`/zip/${formData.zip}`, {
//         state: {
//           prediction: {
//             predictedPrice: Number(data.predicted_price),
//             beds: Number(data.beds),
//             baths: Number(data.baths),
//             sqft: Number(data.sqft),
//           },
//         },
//       });
//     } catch {
//       setSubmitError(
//         'Could not reach the backend. Make sure it is running on port 8000.',
//       );
//     } finally {
//       setAnalysisLoading(false);
//     }
//   };

//   const handleClearAll = () => {
//     setFormData(defaultFormData);
//     setPendingBedsBaths({ bedrooms: '', bathrooms: '' });
//     setPendingSqft('');
//     setSqftError('');
//     setIsBedsBathsOpen(false);
//     setIsSqftOpen(false);
//     setSelectedZip('');
//     setSubmitError(null);
//   };

//   // ── Render ─────────────────────────────────────────────────────
//   return (
//     <form onSubmit={handleSubmit} className="w-full">
//       <div className="rounded-lg border border-gray-200/90 bg-gray-50/90 px-4 py-3.5 shadow-[0_5px_16px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.65)]">
//         <div className="flex flex-wrap items-center gap-3">
//           {/* ── ZIP Code ── */}
//           <div className="min-w-[160px] flex-1">
//             <div className="relative">
//               <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
//                 <svg
//                   className="h-4 w-4 opacity-90"
//                   viewBox="0 0 20 20"
//                   fill="none"
//                   aria-hidden="true"
//                 >
//                   <path
//                     d="m14 14 3.5 3.5M9 15.5a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13Z"
//                     stroke="currentColor"
//                     strokeWidth="1.6"
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                   />
//                 </svg>
//               </div>
//               <label className="pointer-events-none absolute left-10 top-[6px] text-[11px] font-semibold uppercase tracking-wide text-gray-500">
//                 ZIP Code
//               </label>
//               <input
//                 type="text"
//                 inputMode="numeric"
//                 name="zip"
//                 autoComplete="postal-code"
//                 maxLength={5}
//                 value={formData.zip}
//                 onChange={handleChange}
//                 placeholder="e.g. 75201"
//                 aria-label="ZIP code, 5 digits"
//                 className={`h-12 w-full rounded-lg border pl-10 pr-4 pb-[8px] pt-4.5 text-base tabular-nums tracking-wide text-gray-900 outline-none placeholder:text-gray-400 ${filterControlTransition} ${
//                   isZipActive
//                     ? 'border-[#006400]/45 bg-[#006400]/[0.04] font-bold text-gray-950 shadow-[inset_0_0_0_1px_rgba(0,100,0,0.05)] hover:border-[#006400]/55'
//                     : 'border-gray-200/95 bg-white font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] hover:border-gray-300'
//                 } focus-visible:border-[#006400] focus-visible:ring-2 focus-visible:ring-[#006400]/22 focus-visible:ring-offset-0`}
//               />
//             </div>
//           </div>

//           {/* ── Beds & Baths ── */}
//           <div ref={bedsBathsRef} className="relative min-w-[180px] flex-1">
//             <button
//               type="button"
//               onClick={() => {
//                 setPendingBedsBaths({
//                   bedrooms: formData.bedrooms,
//                   bathrooms: formData.bathrooms,
//                 });
//                 setIsBedsBathsOpen((prev) => !prev);
//               }}
//               className={getFilterControlClass(isBedsBathsActive)}
//             >
//               <span className="flex items-center justify-between gap-3">
//                 <span className="min-w-0">
//                   <span className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
//                     Beds & Baths
//                   </span>
//                   <span className={getFilterValueClass(isBedsBathsActive)}>
//                     {getBedsBathsLabel()}
//                   </span>
//                 </span>
//                 <svg
//                   className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${isBedsBathsOpen ? 'rotate-180' : ''}`}
//                   viewBox="0 0 20 20"
//                   fill="none"
//                   aria-hidden="true"
//                 >
//                   <path
//                     d="m5 7.5 5 5 5-5"
//                     stroke="currentColor"
//                     strokeWidth="1.6"
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                   />
//                 </svg>
//               </span>
//             </button>

//             {isBedsBathsOpen && (
//               <div className="absolute left-0 top-[calc(100%+10px)] z-20 w-[280px] rounded-lg border border-gray-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.14)]">
//                 <div className="mb-5">
//                   <p className="mb-2.5 text-[13px] font-semibold uppercase tracking-wide text-gray-600">
//                     Bedrooms
//                   </p>
//                   <div className="flex gap-2">
//                     {BED_OPTIONS.map((n) => (
//                       <button
//                         key={n}
//                         type="button"
//                         onClick={() =>
//                           setPendingBedsBaths((prev) => ({
//                             ...prev,
//                             bedrooms: String(n),
//                           }))
//                         }
//                         className={pickerBtnClass(
//                           pendingBedsBaths.bedrooms === String(n),
//                         )}
//                       >
//                         {n}
//                       </button>
//                     ))}
//                   </div>
//                   <p className="mt-2 text-xs text-gray-400">
//                     Select exact number of bedrooms
//                   </p>
//                 </div>
//                 <div>
//                   <p className="mb-2.5 text-[13px] font-semibold uppercase tracking-wide text-gray-600">
//                     Bathrooms
//                   </p>
//                   <div className="flex gap-2">
//                     {BATH_OPTIONS.map((n) => (
//                       <button
//                         key={n}
//                         type="button"
//                         onClick={() =>
//                           setPendingBedsBaths((prev) => ({
//                             ...prev,
//                             bathrooms: String(n),
//                           }))
//                         }
//                         className={pickerBtnClass(
//                           pendingBedsBaths.bathrooms === String(n),
//                         )}
//                       >
//                         {n}
//                       </button>
//                     ))}
//                   </div>
//                   <p className="mt-2 text-xs text-gray-400">
//                     Select exact number of bathrooms
//                   </p>
//                 </div>
//                 <div className="mt-5 flex items-center justify-between">
//                   <button
//                     type="button"
//                     onClick={() =>
//                       setPendingBedsBaths({ bedrooms: '', bathrooms: '' })
//                     }
//                     className="text-sm font-semibold text-gray-500 transition hover:text-gray-700"
//                   >
//                     Clear
//                   </button>
//                   <button
//                     type="button"
//                     onClick={applyBedsBaths}
//                     className="h-9 rounded-md bg-[#006400] px-5 text-[13px] font-semibold text-white transition-shadow hover:shadow-[inset_0_0_0_9999px_rgba(0,0,0,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006400]/30 focus-visible:ring-offset-2"
//                   >
//                     Apply
//                   </button>
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* ── Square Footage ── */}
//           <div ref={sqftRef} className="relative min-w-[160px] flex-1">
//             <button
//               type="button"
//               onClick={() => {
//                 setPendingSqft(
//                   formData.sqft !== '' ? String(formData.sqft) : '',
//                 );
//                 setSqftError('');
//                 setIsSqftOpen((prev) => !prev);
//               }}
//               className={getFilterControlClass(isSqftActive)}
//             >
//               <span className="flex items-center justify-between gap-3">
//                 <span className="min-w-0">
//                   <span className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
//                     Square Footage
//                   </span>
//                   <span className={getFilterValueClass(isSqftActive)}>
//                     {getSqftLabel()}
//                   </span>
//                 </span>
//                 <svg
//                   className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${isSqftOpen ? 'rotate-180' : ''}`}
//                   viewBox="0 0 20 20"
//                   fill="none"
//                   aria-hidden="true"
//                 >
//                   <path
//                     d="m5 7.5 5 5 5-5"
//                     stroke="currentColor"
//                     strokeWidth="1.6"
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                   />
//                 </svg>
//               </span>
//             </button>

//             {isSqftOpen && (
//               <div className="absolute left-0 top-[calc(100%+10px)] z-20 w-[280px] rounded-lg border border-gray-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.14)]">
//                 <p className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-gray-600">
//                   Square Footage
//                 </p>
//                 <div className="relative">
//                   <input
//                     type="text"
//                     inputMode="numeric"
//                     value={pendingSqft}
//                     onChange={(e) => {
//                       setPendingSqft(e.target.value.replace(/[^\d]/g, ''));
//                       setSqftError('');
//                     }}
//                     onKeyDown={(e) => {
//                       if (e.key === 'Enter') {
//                         e.preventDefault();
//                         applySqft();
//                       }
//                     }}
//                     placeholder="e.g. 2000"
//                     className={`h-11 w-full rounded-md border px-3.5 pr-14 text-[15px] text-gray-900 outline-none transition-all ${
//                       sqftError
//                         ? 'border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-400/20'
//                         : 'border-gray-300 bg-gray-50/40 focus:border-[#006400] focus:ring-2 focus:ring-[#006400]/20'
//                     }`}
//                   />
//                   <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">
//                     sqft
//                   </span>
//                 </div>
//                 {sqftError ? (
//                   <p className="mt-1.5 text-xs font-medium text-red-500">
//                     {sqftError}
//                   </p>
//                 ) : (
//                   <p className="mt-1.5 text-xs text-gray-400">
//                     Valid range: {SQFT_MIN.toLocaleString()}–
//                     {SQFT_MAX.toLocaleString()} sqft
//                   </p>
//                 )}
//                 <div className="mt-4">
//                   <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
//                     Common sizes
//                   </p>
//                   <div className="flex flex-wrap gap-2">
//                     {[800, 1200, 1500, 2000, 2500, 3000, 4000].map((v) => (
//                       <button
//                         key={v}
//                         type="button"
//                         onClick={() => {
//                           setPendingSqft(String(v));
//                           setSqftError('');
//                         }}
//                         className={`h-8 rounded-md px-3 text-xs font-semibold transition ${
//                           pendingSqft === String(v)
//                             ? 'bg-[#006400] text-white'
//                             : 'border border-gray-300 bg-white text-gray-600 hover:border-[#006400]/60 hover:text-[#006400]'
//                         }`}
//                       >
//                         {v.toLocaleString()}
//                       </button>
//                     ))}
//                   </div>
//                 </div>
//                 <div className="mt-5 flex items-center justify-between">
//                   <button
//                     type="button"
//                     onClick={() => {
//                       setPendingSqft('');
//                       setSqftError('');
//                     }}
//                     className="text-sm font-semibold text-gray-500 transition hover:text-gray-700"
//                   >
//                     Clear
//                   </button>
//                   <button
//                     type="button"
//                     onClick={applySqft}
//                     className="h-9 rounded-md bg-[#006400] px-5 text-[13px] font-semibold text-white transition-shadow hover:shadow-[inset_0_0_0_9999px_rgba(0,0,0,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006400]/30 focus-visible:ring-offset-2"
//                   >
//                     Apply
//                   </button>
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* ── Clear All ── */}
//           <button
//             type="button"
//             onClick={handleClearAll}
//             className={`h-12 rounded-md px-2 text-sm font-semibold transition-[color,background-color,box-shadow] duration-200 ease-out ${
//               hasAnyActiveFilters
//                 ? 'text-gray-600 hover:bg-gray-100/85 hover:text-gray-800 active:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400/35 focus-visible:ring-offset-2'
//                 : 'cursor-default text-gray-400'
//             }`}
//             disabled={!hasAnyActiveFilters}
//             aria-label="Clear all filters"
//           >
//             Clear all
//           </button>

//           {/* ── Analyze Property ── */}
//           <button
//             type="submit"
//             disabled={analysisLoading}
//             className="h-12 min-w-[170px] rounded-lg bg-[#006400] px-5 text-base font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.12)] transition-[box-shadow,transform,filter] duration-200 ease-out hover:shadow-[0_2px_6px_rgba(0,0,0,0.14),inset_0_0_0_9999px_rgba(0,0,0,0.06)] active:translate-y-px active:shadow-[0_1px_2px_rgba(0,0,0,0.14),inset_0_0_0_9999px_rgba(0,0,0,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006400]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:pointer-events-none disabled:opacity-60"
//           >
//             {analysisLoading ? 'Analyzing…' : 'Analyze Property'}
//           </button>
//         </div>

//         {submitError && (
//           <p className="mt-2 text-sm font-medium text-red-600" role="alert">
//             {submitError}
//           </p>
//         )}
//       </div>
//     </form>
//   );
// }
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SQFT_MIN = 400;
const SQFT_MAX = 10000;

const BED_OPTIONS = [1, 2, 3, 4, 5, 6];
const BATH_OPTIONS = [1, 2, 3, 4, 5, 6];

export default function PropertyForm({ selectedZip, setSelectedZip }) {
  const navigate = useNavigate();

  const defaultFormData = {
    zip: '',
    bedrooms: '',
    bathrooms: '',
    sqft: '',
  };

  const [formData, setFormData] = useState({
    ...defaultFormData,
    zip: selectedZip || '',
  });
  const [isBedsBathsOpen, setIsBedsBathsOpen] = useState(false);
  const [isSqftOpen, setIsSqftOpen] = useState(false);
  const [pendingBedsBaths, setPendingBedsBaths] = useState({
    bedrooms: '',
    bathrooms: '',
  });
  const [pendingSqft, setPendingSqft] = useState('');
  const [sqftError, setSqftError] = useState('');
  const [submitError, setSubmitError] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  const bedsBathsRef = useRef(null);
  const sqftRef = useRef(null);

  const sanitizeZipInput = (value) => value.replace(/\D/g, '').slice(0, 5);

  // ── Label helpers ──────────────────────────────────────────────
  const getBedsBathsLabel = () => {
    const { bedrooms, bathrooms } = formData;
    if (!bedrooms && !bathrooms) return 'Beds & Baths';
    if (bedrooms && bathrooms) return `${bedrooms} bd · ${bathrooms} ba`;
    if (bedrooms) return `${bedrooms} bd`;
    return `${bathrooms} ba`;
  };

  const getSqftLabel = () => {
    if (!formData.sqft) return 'Sq Ft';
    return `${Number(formData.sqft).toLocaleString()} sqft`;
  };

  // ── Active / complete flags ────────────────────────────────────
  const isZipActive = Boolean(String(formData.zip || '').trim());
  const isBedsBathsActive = Boolean(formData.bedrooms || formData.bathrooms);
  const isSqftActive = Boolean(formData.sqft);
  const hasAnyActiveFilters = isZipActive || isBedsBathsActive || isSqftActive;

  // All four fields must be filled to submit
  const isFormComplete =
    String(formData.zip).length === 5 &&
    Boolean(formData.bedrooms) &&
    Boolean(formData.bathrooms) &&
    Boolean(formData.sqft);

  // ── Styling helpers ────────────────────────────────────────────
  const filterControlTransition =
    'transition-[border-color,box-shadow,background-color] duration-200 ease-out';

  const getFilterControlClass = (isActive) =>
    `h-12 w-full rounded-lg border bg-white px-4 text-left text-gray-900 outline-none ${filterControlTransition} ${
      isActive
        ? 'border-[#006400]/45 bg-[#006400]/[0.04] shadow-[inset_0_0_0_1px_rgba(0,100,0,0.05)] hover:border-[#006400]/55 hover:shadow-[inset_0_0_0_1px_rgba(0,100,0,0.07),0_1px_2px_rgba(15,23,42,0.04)]'
        : 'border-gray-200/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] hover:border-gray-300 hover:shadow-[0_1px_2px_rgba(15,23,42,0.05),inset_0_0_0_1px_rgba(15,23,42,0.03)]'
    } focus-visible:border-[#006400] focus-visible:ring-2 focus-visible:ring-[#006400]/22 focus-visible:ring-offset-0`;

  const getFilterValueClass = (isActive) =>
    `block truncate text-base ${isActive ? 'font-bold text-gray-950' : 'font-semibold text-gray-900'}`;

  const pickerBtnClass = (selected) =>
    `h-9 w-10 rounded-md text-[13px] font-semibold transition ${
      selected
        ? 'bg-[#006400] text-white shadow-sm'
        : 'border border-gray-300 bg-white text-gray-700 hover:border-[#006400]/60 hover:text-[#006400]'
    }`;

  // ── Apply handlers ─────────────────────────────────────────────
  const applyBedsBaths = () => {
    setFormData((prev) => ({
      ...prev,
      bedrooms: pendingBedsBaths.bedrooms,
      bathrooms: pendingBedsBaths.bathrooms,
    }));
    setIsBedsBathsOpen(false);
  };

  const applySqft = () => {
    const val = Number(pendingSqft);
    if (
      pendingSqft !== '' &&
      (!Number.isFinite(val) || val < SQFT_MIN || val > SQFT_MAX)
    ) {
      setSqftError(
        `Enter a value between ${SQFT_MIN.toLocaleString()} and ${SQFT_MAX.toLocaleString()} sqft`,
      );
      return;
    }
    setSqftError('');
    setFormData((prev) => ({ ...prev, sqft: pendingSqft === '' ? '' : val }));
    setIsSqftOpen(false);
  };

  // ── Click-outside handlers ─────────────────────────────────────
  useEffect(() => {
    if (!isBedsBathsOpen) return;
    const handler = (e) => {
      if (bedsBathsRef.current && !bedsBathsRef.current.contains(e.target))
        setIsBedsBathsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isBedsBathsOpen]);

  useEffect(() => {
    if (!isSqftOpen) return;
    const handler = (e) => {
      if (sqftRef.current && !sqftRef.current.contains(e.target)) {
        setSqftError('');
        setIsSqftOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isSqftOpen]);

  useEffect(() => {
    setFormData((prev) => ({ ...prev, zip: selectedZip || '' }));
  }, [selectedZip]);

  // ── Form handlers ──────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'zip') {
      const sanitized = sanitizeZipInput(value);
      setFormData((prev) => ({ ...prev, zip: sanitized }));
      setSelectedZip(sanitized);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    // Client-side validation — all fields required
    if (!formData.zip || String(formData.zip).length !== 5) {
      setSubmitError('Please enter a valid 5-digit ZIP code.');
      return;
    }
    if (!formData.bedrooms) {
      setSubmitError('Please select the number of bedrooms.');
      return;
    }
    if (!formData.bathrooms) {
      setSubmitError('Please select the number of bathrooms.');
      return;
    }
    if (!formData.sqft) {
      setSubmitError('Please enter the square footage.');
      return;
    }

    setAnalysisLoading(true);

    try {
      const payload = {
        zip_code: String(formData.zip),
        beds: Number(formData.bedrooms),
        baths: Number(formData.bathrooms),
        sqft: Number(formData.sqft),
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
      };

      const response = await fetch('http://127.0.0.1:8000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setSubmitError(data?.detail || 'Prediction failed.');
        return;
      }

      navigate(`/zip/${formData.zip}`, {
        state: {
          prediction: {
            predictedPrice: Number(data.predicted_price),
            beds: Number(data.beds),
            baths: Number(data.baths),
            sqft: Number(data.sqft),
          },
        },
      });
    } catch {
      setSubmitError(
        'Could not reach the backend. Make sure it is running on port 8000.',
      );
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleClearAll = () => {
    setFormData(defaultFormData);
    setPendingBedsBaths({ bedrooms: '', bathrooms: '' });
    setPendingSqft('');
    setSqftError('');
    setIsBedsBathsOpen(false);
    setIsSqftOpen(false);
    setSelectedZip('');
    setSubmitError(null);
  };

  // ── Render ─────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="rounded-lg border border-gray-200/90 bg-gray-50/90 px-4 py-3.5 shadow-[0_5px_16px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.65)]">
        <div className="flex flex-wrap items-center gap-3">
          {/* ── ZIP Code ── */}
          <div className="min-w-[160px] flex-1">
            <div className="relative">
              <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <svg
                  className="h-4 w-4 opacity-90"
                  viewBox="0 0 20 20"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="m14 14 3.5 3.5M9 15.5a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <label className="pointer-events-none absolute left-10 top-[6px] text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                ZIP Code
              </label>
              <input
                type="text"
                inputMode="numeric"
                name="zip"
                autoComplete="postal-code"
                maxLength={5}
                value={formData.zip}
                onChange={handleChange}
                placeholder="e.g. 75201"
                aria-label="ZIP code, 5 digits"
                className={`h-12 w-full rounded-lg border pl-10 pr-4 pb-[8px] pt-4.5 text-base tabular-nums tracking-wide text-gray-900 outline-none placeholder:text-gray-400 ${filterControlTransition} ${
                  isZipActive
                    ? 'border-[#006400]/45 bg-[#006400]/[0.04] font-bold text-gray-950 shadow-[inset_0_0_0_1px_rgba(0,100,0,0.05)] hover:border-[#006400]/55'
                    : 'border-gray-200/95 bg-white font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] hover:border-gray-300'
                } focus-visible:border-[#006400] focus-visible:ring-2 focus-visible:ring-[#006400]/22 focus-visible:ring-offset-0`}
              />
            </div>
          </div>

          {/* ── Beds & Baths ── */}
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
              className={getFilterControlClass(isBedsBathsActive)}
            >
              <span className="flex items-center justify-between gap-3">
                <span className="min-w-0">
                  <span className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Beds & Baths <span className="text-red-400">*</span>
                  </span>
                  <span className={getFilterValueClass(isBedsBathsActive)}>
                    {getBedsBathsLabel()}
                  </span>
                </span>
                <svg
                  className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${isBedsBathsOpen ? 'rotate-180' : ''}`}
                  viewBox="0 0 20 20"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="m5 7.5 5 5 5-5"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </button>

            {isBedsBathsOpen && (
              <div className="absolute left-0 top-[calc(100%+10px)] z-20 w-[280px] rounded-lg border border-gray-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.14)]">
                <div className="mb-5">
                  <p className="mb-2.5 text-[13px] font-semibold uppercase tracking-wide text-gray-600">
                    Bedrooms
                  </p>
                  <div className="flex gap-2">
                    {BED_OPTIONS.map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() =>
                          setPendingBedsBaths((prev) => ({
                            ...prev,
                            bedrooms: String(n),
                          }))
                        }
                        className={pickerBtnClass(
                          pendingBedsBaths.bedrooms === String(n),
                        )}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-gray-400">
                    Select exact number of bedrooms
                  </p>
                </div>
                <div>
                  <p className="mb-2.5 text-[13px] font-semibold uppercase tracking-wide text-gray-600">
                    Bathrooms
                  </p>
                  <div className="flex gap-2">
                    {BATH_OPTIONS.map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() =>
                          setPendingBedsBaths((prev) => ({
                            ...prev,
                            bathrooms: String(n),
                          }))
                        }
                        className={pickerBtnClass(
                          pendingBedsBaths.bathrooms === String(n),
                        )}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-gray-400">
                    Select exact number of bathrooms
                  </p>
                </div>
                <div className="mt-5 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() =>
                      setPendingBedsBaths({ bedrooms: '', bathrooms: '' })
                    }
                    className="text-sm font-semibold text-gray-500 transition hover:text-gray-700"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={applyBedsBaths}
                    className="h-9 rounded-md bg-[#006400] px-5 text-[13px] font-semibold text-white transition-shadow hover:shadow-[inset_0_0_0_9999px_rgba(0,0,0,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006400]/30 focus-visible:ring-offset-2"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Square Footage ── */}
          <div ref={sqftRef} className="relative min-w-[160px] flex-1">
            <button
              type="button"
              onClick={() => {
                setPendingSqft(
                  formData.sqft !== '' ? String(formData.sqft) : '',
                );
                setSqftError('');
                setIsSqftOpen((prev) => !prev);
              }}
              className={getFilterControlClass(isSqftActive)}
            >
              <span className="flex items-center justify-between gap-3">
                <span className="min-w-0">
                  <span className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Square Footage <span className="text-red-400">*</span>
                  </span>
                  <span className={getFilterValueClass(isSqftActive)}>
                    {getSqftLabel()}
                  </span>
                </span>
                <svg
                  className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${isSqftOpen ? 'rotate-180' : ''}`}
                  viewBox="0 0 20 20"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="m5 7.5 5 5 5-5"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </button>

            {isSqftOpen && (
              <div className="absolute left-0 top-[calc(100%+10px)] z-20 w-[280px] rounded-lg border border-gray-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.14)]">
                <p className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-gray-600">
                  Square Footage
                </p>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={pendingSqft}
                    onChange={(e) => {
                      setPendingSqft(e.target.value.replace(/[^\d]/g, ''));
                      setSqftError('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        applySqft();
                      }
                    }}
                    placeholder="e.g. 1200"
                    className={`h-11 w-full rounded-md border px-3.5 pr-14 text-[15px] text-gray-900 outline-none transition-all ${
                      sqftError
                        ? 'border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-400/20'
                        : 'border-gray-300 bg-gray-50/40 focus:border-[#006400] focus:ring-2 focus:ring-[#006400]/20'
                    }`}
                  />
                  <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">
                    sqft
                  </span>
                </div>
                {sqftError ? (
                  <p className="mt-1.5 text-xs font-medium text-red-500">
                    {sqftError}
                  </p>
                ) : (
                  <p className="mt-1.5 text-xs text-gray-400">
                    Min {SQFT_MIN.toLocaleString()} sqft (studio) · Max{' '}
                    {SQFT_MAX.toLocaleString()} sqft
                  </p>
                )}
                <div className="mt-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Common sizes
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[600, 800, 1000, 1200, 1500, 2000, 2500, 3000].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => {
                          setPendingSqft(String(v));
                          setSqftError('');
                        }}
                        className={`h-8 rounded-md px-3 text-xs font-semibold transition ${
                          pendingSqft === String(v)
                            ? 'bg-[#006400] text-white'
                            : 'border border-gray-300 bg-white text-gray-600 hover:border-[#006400]/60 hover:text-[#006400]'
                        }`}
                      >
                        {v.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-5 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setPendingSqft('');
                      setSqftError('');
                    }}
                    className="text-sm font-semibold text-gray-500 transition hover:text-gray-700"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={applySqft}
                    className="h-9 rounded-md bg-[#006400] px-5 text-[13px] font-semibold text-white transition-shadow hover:shadow-[inset_0_0_0_9999px_rgba(0,0,0,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006400]/30 focus-visible:ring-offset-2"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Clear All ── */}
          <button
            type="button"
            onClick={handleClearAll}
            className={`h-12 rounded-md px-2 text-sm font-semibold transition-[color,background-color,box-shadow] duration-200 ease-out ${
              hasAnyActiveFilters
                ? 'text-gray-600 hover:bg-gray-100/85 hover:text-gray-800 active:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400/35 focus-visible:ring-offset-2'
                : 'cursor-default text-gray-400'
            }`}
            disabled={!hasAnyActiveFilters}
            aria-label="Clear all filters"
          >
            Clear all
          </button>

          {/* ── Analyze Property ── */}
          <button
            type="submit"
            disabled={analysisLoading}
            className="h-12 min-w-[170px] rounded-lg bg-[#006400] px-5 text-base font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.12)] transition-[box-shadow,transform,filter] duration-200 ease-out hover:shadow-[0_2px_6px_rgba(0,0,0,0.14),inset_0_0_0_9999px_rgba(0,0,0,0.06)] active:translate-y-px active:shadow-[0_1px_2px_rgba(0,0,0,0.14),inset_0_0_0_9999px_rgba(0,0,0,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006400]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:pointer-events-none disabled:opacity-60"
          >
            {analysisLoading ? 'Analyzing…' : 'Analyze Property'}
          </button>
        </div>

        {/* Completion hint */}
        {!isFormComplete && !submitError && (
          <p className="mt-2 text-xs text-gray-400">
            Fill in ZIP code, beds &amp; baths, and square footage to get a
            price estimate.
          </p>
        )}

        {submitError && (
          <p className="mt-2 text-sm font-medium text-red-600" role="alert">
            {submitError}
          </p>
        )}
      </div>
    </form>
  );
}
