from pathlib import Path
import joblib
import pandas as pd

MODEL_PATH = Path(__file__).resolve().parent.parent / "data" / "texas_house_price_model_new.pkl"

_model = None


def _load_model():
    global _model
    if _model is None:
        if not MODEL_PATH.exists():
            raise FileNotFoundError(
                f"Model file not found at {MODEL_PATH}. "
                "Place texas_house_price_model_new.pkl in the backend/data/ directory."
            )
        _model = joblib.load(MODEL_PATH)
    return _model


def _month_to_quarter(month: int) -> str:
    return f"Q{(month - 1) // 3 + 1}"


def get_valid_zip_codes() -> list[str]:
    model = _load_model()
    encoder = model.named_steps["preprocessor"].named_transformers_["zip"]
    return list(encoder.categories_[0])


def predict_price(data) -> float:
    """Single point-in-time prediction."""
    model = _load_model()

    zip_code = str(data.zip_code).strip()
    if zip_code not in get_valid_zip_codes():
        raise ValueError(
            f"ZIP code '{zip_code}' is not in the model's training data. "
            "Please use a valid Texas ZIP code."
        )

    df = pd.DataFrame([{
        "zip_code": zip_code,
        "quarter": _month_to_quarter(data.month),
        "year": int(data.year),
        "beds": int(data.beds),
        "baths": int(data.baths),
        "sqft": int(data.sqft),
    }])

    return round(float(_load_model().predict(df)[0]), 2)


def predict_forecast(data, years_ahead: int = 3) -> list[dict]:
    """
    Generate a quarterly forecast series starting from the quarter AFTER
    data.year/data.month, running for `years_ahead` full years (4*years_ahead points).

    Returns list of { date: 'YYYY QN', value: float }
    """
    model = _load_model()

    zip_code = str(data.zip_code).strip()
    if zip_code not in get_valid_zip_codes():
        raise ValueError(
            f"ZIP code '{zip_code}' is not in the model's training data."
        )

    # Start from the next quarter after the input month
    current_quarter = (data.month - 1) // 3  # 0-indexed (0=Q1 … 3=Q4)
    next_quarter = (current_quarter + 1) % 4
    next_year = data.year + (1 if current_quarter == 3 else 0)

    points = []
    q = next_quarter
    y = next_year

    for _ in range(4 * years_ahead):
        quarter_str = f"Q{q + 1}"
        df = pd.DataFrame([{
            "zip_code": zip_code,
            "quarter": quarter_str,
            "year": y,
            "beds": int(data.beds),
            "baths": int(data.baths),
            "sqft": int(data.sqft),
        }])
        price = round(float(model.predict(df)[0]), 2)
        points.append({"date": f"{y} {quarter_str}", "value": price})

        q = (q + 1) % 4
        if q == 0:
            y += 1

    return points