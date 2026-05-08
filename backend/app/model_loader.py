from pathlib import Path
import joblib
import pandas as pd
import numpy as np

# PKL HERE
MODEL_PATH = Path(__file__).resolve().parent.parent / "data" / "prophet_texas_forecast_model_fixed.pkl"

_model = None


def _load_model():
    global _model
    if _model is None:
        if not MODEL_PATH.exists():
            raise FileNotFoundError(
                f"Model file not found at {MODEL_PATH}. "
                "Place prophet_texas_forecast_model.pkl in the backend/data/ directory."
            )
        _model = joblib.load(MODEL_PATH)
    return _model


def get_valid_zip_codes() -> list[str]:
    model = _load_model()
    return list(model["prophet_models"].keys())


def _get_adjustment(adjuster, beds: int, baths: float, sqft: int) -> float:
    """Use the linear adjuster to compute a price delta based on house features."""
    features = pd.DataFrame([{"beds": beds, "baths": baths, "sqft": sqft}])
    return float(adjuster.predict(features)[0])


def _prophet_predict_at_date(zip_code: str, target_date: pd.Timestamp, beds: int, baths: float, sqft: int) -> float:
    """Get a price prediction for a specific zip code and date."""
    model = _load_model()
    prophet_models = model["prophet_models"]
    adjuster = model["adjuster"]

    pm = prophet_models[zip_code]

    # Build a future dataframe that includes the target date
    future = pd.DataFrame({"ds": [target_date]})
    forecast = pm.predict(future)
    base_price = float(forecast["yhat"].iloc[0])

    adjustment = _get_adjustment(adjuster, beds, baths, sqft)

    return round(base_price + adjustment, 2)


def predict_price(data) -> float:
    """Single point-in-time prediction."""
    zip_code = str(data.zip_code).strip()

    if zip_code not in get_valid_zip_codes():
        raise ValueError(
            f"ZIP code '{zip_code}' is not in the model's training data. "
            "Please use a valid Dallas ZIP code."
        )

    # Use the 1st of the given month as the target date
    target_date = pd.Timestamp(year=int(data.year), month=int(data.month), day=1)

    return _prophet_predict_at_date(
        zip_code=zip_code,
        target_date=target_date,
        beds=int(data.beds),
        baths=float(data.baths),
        sqft=int(data.sqft),
    )


def predict_forecast(data, years_ahead: int = 3) -> list[dict]:
    """
    Generate a quarterly forecast series starting from the quarter AFTER
    data.year/data.month, running for `years_ahead` full years (4*years_ahead points).

    Returns list of { date: 'YYYY QN', value: float }
    """
    zip_code = str(data.zip_code).strip()

    if zip_code not in get_valid_zip_codes():
        raise ValueError(
            f"ZIP code '{zip_code}' is not in the model's training data."
        )

    # Start from the next quarter after the input month
    current_quarter = (int(data.month) - 1) // 3  # 0-indexed (0=Q1 … 3=Q4)
    next_quarter = (current_quarter + 1) % 4
    next_year = int(data.year) + (1 if current_quarter == 3 else 0)

    # Quarter start months: Q1=1, Q2=4, Q3=7, Q4=10
    quarter_start_months = [1, 4, 7, 10]

    points = []
    q = next_quarter
    y = next_year

    for _ in range(4 * years_ahead):
        quarter_str = f"Q{q + 1}"
        target_date = pd.Timestamp(year=y, month=quarter_start_months[q], day=1)

        price = _prophet_predict_at_date(
            zip_code=zip_code,
            target_date=target_date,
            beds=int(data.beds),
            baths=float(data.baths),
            sqft=int(data.sqft),
        )

        points.append({"date": f"{y} {quarter_str}", "value": price})

        q = (q + 1) % 4
        if q == 0:
            y += 1

    return points