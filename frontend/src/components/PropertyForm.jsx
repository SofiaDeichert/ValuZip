import { useState, useEffect } from "react";

export default function PropertyForm({ selectedZip, setSelectedZip }) {
  const [formData, setFormData] = useState({
    zip: selectedZip || "",
    bedrooms: "",
    bathrooms: "",
    sqft: "",
    yearBuilt: "",
  });

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      zip: selectedZip || "",
    }));
  }, [selectedZip]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "zip") {
      setSelectedZip(value);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Property data submitted:", formData);
  };

  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        borderRadius: "16px",
        padding: "28px",
        boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
      }}
    >
      <h2
        style={{
          margin: 0,
          fontSize: "26px",
          fontWeight: "700",
          color: "#111827",
        }}
      >
        Property Details
      </h2>

      <p
        style={{
          marginTop: "8px",
          marginBottom: "24px",
          fontSize: "14px",
          color: "#6b7280",
        }}
      >
        Enter property characteristics to estimate market value.
      </p>

      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "18px",
        }}
      >
        <div>
          <label style={labelStyle}>ZIP Code</label>
          <input
            type="text"
            name="zip"
            value={formData.zip}
            onChange={handleChange}
            placeholder="Enter ZIP code"
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Bedrooms</label>
          <input
            type="number"
            name="bedrooms"
            value={formData.bedrooms}
            onChange={handleChange}
            placeholder="e.g. 3"
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Bathrooms</label>
          <input
            type="number"
            name="bathrooms"
            value={formData.bathrooms}
            onChange={handleChange}
            placeholder="e.g. 2"
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Square Footage</label>
          <input
            type="number"
            name="sqft"
            value={formData.sqft}
            onChange={handleChange}
            placeholder="e.g. 1800"
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Year Built</label>
          <input
            type="number"
            name="yearBuilt"
            value={formData.yearBuilt}
            onChange={handleChange}
            placeholder="e.g. 2015"
            style={inputStyle}
          />
        </div>

        <button
          type="submit"
          style={{
            padding: "14px",
            backgroundColor: "#16a34a",
            color: "white",
            border: "none",
            borderRadius: "10px",
            fontSize: "16px",
            fontWeight: "700",
            cursor: "pointer",
            marginTop: "10px",
            boxShadow: "0 2px 8px rgba(22,163,74,0.25)",
          }}
        >
          Analyze Property
        </button>
      </form>
    </div>
  );
}

const labelStyle = {
  display: "block",
  marginBottom: "6px",
  fontSize: "14px",
  fontWeight: "600",
  color: "#111827",
};

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "10px",
  border: "1px solid #d1d5db",
  fontSize: "15px",
  backgroundColor: "#ffffff",
  outline: "none",
};