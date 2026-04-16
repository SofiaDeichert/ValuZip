import csv
from pathlib import Path
from datetime import datetime, date
from collections import defaultdict
import statistics

BASE_DIR = Path(__file__).resolve().parent.parent
CSV_FILE = BASE_DIR / "data" / "FINAL_DATASET_TEXAS.csv"


SQFT_TOLERANCE = 0.15  # ±15% band around the user's sqft
MIN_MATCHED_SALES = 8


def _collect_history(
    zip_code: str,
    beds: int,
    baths: int,
    years: int,
    sqft: int | None,
    sqft_tolerance: float | None,
    baths_tolerance: int = 0,
):
    """
    Internal helper to collect monthly sale prices according to the
    provided tolerances. Returns (by_month, matched_sales).
    """
    if not CSV_FILE.exists():
        raise FileNotFoundError(f"Dataset not found at {CSV_FILE}")

    cutoff = date.today().replace(year=date.today().year - years)

    if sqft is not None and sqft_tolerance is not None:
        sqft_min = sqft * (1 - sqft_tolerance)
        sqft_max = sqft * (1 + sqft_tolerance)
    else:
        sqft_min = None
        sqft_max = None

    by_month: dict[str, list[float]] = defaultdict(list)
    matched_sales = 0

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

            if row_beds != beds:
                continue

            # baths tolerance: exact by default, or within ±baths_tolerance
            if baths_tolerance == 0:
                if row_baths != baths:
                    continue
            else:
                if abs(row_baths - baths) > baths_tolerance:
                    continue

            # sqft range filter — only applied when sqft and tolerance were provided
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

            matched_sales += 1

            # Key by YYYY-MM for sorting, display as 'Mon YYYY'
            month_key = row_date.strftime("%Y-%m")
            by_month[month_key].append(sale_price)

    return by_month, matched_sales


def get_property_history(
    zip_code: str, beds: int, baths: int, years: int = 3, sqft: int | None = None
) -> dict:
    """
    Reads FINAL_DATASET_TEXAS.csv and returns a monthly median sale price
    time series for comparable sales with a tiered fallback strategy:

    1. strict:
       - same zip_code
       - exact beds
       - exact baths
       - sqft within ±15%
    2. expanded_sqft (if strict below threshold and sqft provided):
       - same zip_code
       - exact beds
       - exact baths
       - sqft within ±25%
    3. expanded_baths (if still below threshold and sqft provided):
       - same zip_code
       - exact beds
       - baths within ±1
       - sqft within ±25%

    The monthly median sale price logic, csv path, and years cutoff
    behaviour are preserved. Dates are formatted as 'Mon YYYY'.

    Returns:
        {
            "history": [...],
            "limited_data": bool,
            "match_level": "strict" | "expanded_sqft" | "expanded_baths" | "none",
            "matched_sales": int,
        }
    """

    # 1. strict match
    by_month, matched_sales = _collect_history(
        zip_code=zip_code,
        beds=beds,
        baths=baths,
        years=years,
        sqft=sqft,
        sqft_tolerance=SQFT_TOLERANCE if sqft is not None else None,
        baths_tolerance=0,
    )

    match_level = "strict"

    # 2. expanded_sqft (only if sqft is provided and strict is below threshold)
    if matched_sales < MIN_MATCHED_SALES and sqft is not None:
        by_month, matched_sales = _collect_history(
            zip_code=zip_code,
            beds=beds,
            baths=baths,
            years=years,
            sqft=sqft,
            sqft_tolerance=0.25,
            baths_tolerance=0,
        )
        match_level = "expanded_sqft"

    # 3. expanded_baths (only if still below threshold and sqft is provided)
    if matched_sales < MIN_MATCHED_SALES and sqft is not None:
        by_month, matched_sales = _collect_history(
            zip_code=zip_code,
            beds=beds,
            baths=baths,
            years=years,
            sqft=sqft,
            sqft_tolerance=0.25,
            baths_tolerance=1,
        )
        match_level = "expanded_baths"

    # 4. If still below threshold, indicate limited data and no history
    if matched_sales < MIN_MATCHED_SALES or not by_month:
        return {
            "history": [],
            "limited_data": True,
            "match_level": "none" if matched_sales == 0 else match_level,
            "matched_sales": matched_sales,
        }

    # Compute monthly medians, preserving existing behaviour
    history = []
    for month_key in sorted(by_month.keys()):
        prices = by_month[month_key]
        median = statistics.median(prices)
        # Format label as 'Jan 2024'
        label = datetime.strptime(month_key, "%Y-%m").strftime("%b %Y")
        history.append({"date": label, "value": round(median, 2)})

    return {
        "history": history,
        "limited_data": False,
        "match_level": match_level,
        "matched_sales": matched_sales,
    }