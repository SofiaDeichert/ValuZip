import csv
from pathlib import Path
from datetime import datetime, date
from collections import defaultdict
import statistics

BASE_DIR = Path(__file__).resolve().parent.parent
CSV_FILE = BASE_DIR / "data" / "FINAL_DATASET_TEXAS.csv"


SQFT_TOLERANCE = 0.15  # ±15% band around the user's sqft


def get_property_history(zip_code: str, beds: int, baths: int, years: int = 3, sqft: int | None = None) -> list[dict]:
    """
    Reads FINAL_DATASET_TEXAS.csv and returns a monthly median sale price
    time series filtered to zip_code + beds + baths + sqft ±15%.

    If sqft is None, no sqft filter is applied (fallback behaviour).

    Returns list of { date: 'Mon YYYY', value: float } sorted ascending.
    """
    if not CSV_FILE.exists():
        raise FileNotFoundError(f"Dataset not found at {CSV_FILE}")

    cutoff = date.today().replace(year=date.today().year - years)

    sqft_min = sqft * (1 - SQFT_TOLERANCE) if sqft else None
    sqft_max = sqft * (1 + SQFT_TOLERANCE) if sqft else None

    by_month: dict[str, list[float]] = defaultdict(list)

    with open(CSV_FILE, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row["zip_code"] != zip_code:
                continue
            try:
                row_beds = int(float(row["beds"]))
                row_baths = int(float(row["baths"]))
            except (ValueError, KeyError):
                continue
            if row_beds != beds or row_baths != baths:
                continue
            # sqft range filter — only applied when sqft was provided
            if sqft_min is not None and sqft_max is not None:
                try:
                    row_sqft = float(row["sqft"])
                except (ValueError, KeyError):
                    continue
                if row_sqft < sqft_min or row_sqft > sqft_max:
                    continue
            try:
                row_date = datetime.strptime(row["date"], "%Y-%m-%d").date()
                sale_price = float(row["sale_price"])
            except (ValueError, KeyError):
                continue
            if row_date < cutoff or sale_price <= 0:
                continue

            # Key by YYYY-MM for sorting, display as 'Mon YYYY'
            month_key = row_date.strftime("%Y-%m")
            by_month[month_key].append(sale_price)

    if not by_month:
        return []

    result = []
    for month_key in sorted(by_month.keys()):
        prices = by_month[month_key]
        median = statistics.median(prices)
        # Format label as 'Jan 2024'
        label = datetime.strptime(month_key, "%Y-%m").strftime("%b %Y")
        result.append({"date": label, "value": round(median, 2)})

    return result