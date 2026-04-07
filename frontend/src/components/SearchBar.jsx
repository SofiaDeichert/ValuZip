import { useState, useEffect } from "react";

export default function SearchBar({ onSearch, selectedZip }) {
  const [zip, setZip] = useState(selectedZip || "");
  const [error, setError] = useState("");

  useEffect(() => {
    setZip(selectedZip || "");
  }, [selectedZip]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const trimmedZip = zip.trim();

    if (!/^\d{5}$/.test(trimmedZip)) {
      setError("Please enter a valid 5-digit ZIP code.");
      return;
    }

    setError("");
    onSearch(trimmedZip);
  };

  return (
    <div
      style={{
        padding: "16px 24px",
        borderBottom: "1px solid #e5e7eb",
        backgroundColor: "#f8fafc",
      }}
    >
      <div style={{ marginBottom: "10px" }}>
        <h2
          style={{
            margin: 0,
            fontSize: "22px",
            fontWeight: "700",
            color: "#111827",
          }}
        >
          Search Dallas ZIP Code
        </h2>
        <p
          style={{
            margin: "4px 0 0 0",
            fontSize: "14px",
            color: "#6b7280",
          }}
        >
          Enter a Dallas ZIP code to focus the map and begin your property analysis.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          gap: "12px",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <input
          type="text"
          placeholder="Enter ZIP code"
          value={zip}
          onChange={(e) => setZip(e.target.value)}
          style={{
            padding: "10px 12px",
            borderRadius: "8px",
            border: "1px solid #d1d5db",
            width: "220px",
            fontSize: "15px",
            outline: "none",
            backgroundColor: "#ffffff",
          }}
        />

        <button
          type="submit"
          style={{
            padding: "10px 16px",
            borderRadius: "8px",
            border: "none",
            backgroundColor: "#2563eb",
            color: "white",
            fontSize: "15px",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          Search
        </button>

        {selectedZip && (
          <div
            style={{
              padding: "8px 12px",
              borderRadius: "999px",
              backgroundColor: "#dbeafe",
              color: "#1d4ed8",
              fontSize: "14px",
              fontWeight: "600",
            }}
          >
            Selected ZIP: {selectedZip}
          </div>
        )}
      </form>

      {error && (
        <p
          style={{
            color: "#dc2626",
            marginTop: "8px",
            fontSize: "14px",
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}