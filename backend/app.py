from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from pathlib import Path

app = FastAPI()

# allow frontend to talk to backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# path to CSV
BASE_DIR = Path(__file__).resolve().parent
CSV_PATH = BASE_DIR.parent / "frontend" / "src" / "data" / "final_recent_3yrs.csv"

# load data
df = pd.read_csv(CSV_PATH)
df.columns = [col.strip() for col in df.columns]

# clean numeric columns
for col in ["sale_price", "beds", "baths", "sqft", "zip_median_price"]:
    if col in df.columns:
        df[col] = pd.to_numeric(df[col], errors="coerce")

# clean zip
if "zip_code" in df.columns:
    df["zip_code"] = (
        df["zip_code"]
        .astype(str)
        .str.replace(r"\.0$", "", regex=True)
        .str.zfill(5)
    )

# clean date
if "date" in df.columns:
    df["date"] = pd.to_datetime(df["date"], errors="coerce")


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/properties")
def get_properties(
    zip: str | None = Query(default=None),
    bedrooms: float | None = Query(default=None),
    bathrooms: float | None = Query(default=None),
    minPrice: float | None = Query(default=None),
    maxPrice: float | None = Query(default=None),
):
    filtered = df.copy()

    if zip:
        filtered = filtered[filtered["zip_code"] == str(zip).zfill(5)]

    if bedrooms is not None and "beds" in filtered.columns:
        filtered = filtered[filtered["beds"] >= bedrooms]

    if bathrooms is not None and "baths" in filtered.columns:
        filtered = filtered[filtered["baths"] >= bathrooms]

    if minPrice is not None and "sale_price" in filtered.columns:
        filtered = filtered[filtered["sale_price"] >= minPrice]

    if maxPrice is not None and "sale_price" in filtered.columns:
        filtered = filtered[filtered["sale_price"] <= maxPrice]

    return {
        "count": int(len(filtered)),
        "results": filtered.head(100).fillna("").to_dict(orient="records"),
    }


@app.get("/api/zip/{zip_code}")
def zip_data(zip_code: str):
    zip_df = df[df["zip_code"] == str(zip_code).zfill(5)]

    if zip_df.empty:
        return {"zip": zip_code, "count": 0}

    median_price = None
    if "zip_median_price" in zip_df.columns:
        val = zip_df["zip_median_price"].median()
        median_price = None if pd.isna(val) else float(val)

    return {
        "zip": str(zip_code).zfill(5),
        "count": int(len(zip_df)),
        "medianHomePrice": median_price,
    }