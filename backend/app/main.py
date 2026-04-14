from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from app.schemas import PredictionInput
from app.model_loader import predict_price, get_valid_zip_codes, predict_forecast
from app.csv_storage import read_predictions, save_prediction, delete_prediction
from app.property_history import get_property_history

app = FastAPI(title="ValuZip Price Prediction API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "ValuZip backend is running 🚀"}


@app.post("/predict")
def predict(data: PredictionInput):
    try:
        predicted_price = predict_price(data)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail=str(e))

    row = {
        "zip_code": data.zip_code,
        "beds": data.beds,
        "baths": data.baths,
        "sqft": data.sqft,
        "year": data.year,
        "month": data.month,
        "predicted_price": predicted_price,
    }
    saved = save_prediction(row)
    return saved


@app.post("/forecast")
def forecast(data: PredictionInput):
    """
    Returns 3 years of quarterly forecast points for a property.
    Each point: { date: 'YYYY QN', value: float }
    """
    try:
        points = predict_forecast(data, years_ahead=3)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail=str(e))
    return {"forecast": points}


@app.get("/property-history")
def property_history(
    zip_code: str = Query(...),
    beds: int = Query(...),
    baths: int = Query(...),
    sqft: int = Query(...),
    years: int = Query(3),
):
    """
    Returns historical monthly median sale prices from the CSV
    filtered to zip + beds + baths + sqft ±15%.
    Each point: { date: 'MMM YYYY', value: float }
    """
    try:
        history = get_property_history(zip_code, beds, baths, years, sqft)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return {"history": history}


@app.get("/predictions")
def get_predictions():
    return read_predictions()


@app.delete("/predictions/{pred_id}")
def remove_prediction(pred_id: int):
    deleted = delete_prediction(pred_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Prediction {pred_id} not found")
    return {"message": f"Prediction {pred_id} deleted successfully"}


@app.get("/valid-zips")
def valid_zips():
    try:
        return {"zip_codes": get_valid_zip_codes()}
    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail=str(e))