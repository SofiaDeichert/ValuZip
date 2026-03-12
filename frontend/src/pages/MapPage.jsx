import { useState } from "react";
import PropertyForm from "../components/PropertyForm";
import MapView from "../components/Map/MapView";

const MapPage = () => {
  const [selectedZip, setSelectedZip] = useState("");

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        backgroundColor: "#f3f4f6",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: "24px",
          padding: "24px",
        }}
      >
        <div
          style={{
            width: "360px",
            flexShrink: 0,
          }}
        >
          <PropertyForm
            selectedZip={selectedZip}
            setSelectedZip={setSelectedZip}
          />
        </div>

        <div
          style={{
            flex: 1,
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
            overflow: "hidden",
            minHeight: "700px",
          }}
        >
          <MapView selectedZip={selectedZip} />
        </div>
      </div>
    </div>
  );
};

export default MapPage;