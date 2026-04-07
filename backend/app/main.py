from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.schemas import PredictionInput
from app.model_loader import predict_price
from app.csv_storage import read_predictions, save_prediction, delete_prediction

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "Backend is running 🚀"}


@app.post("/predict")
def predict(data: PredictionInput):
    predicted_price = predict_price(data)

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


@app.get("/predictions")
def get_predictions():
    return read_predictions()


@app.delete("/predictions/{pred_id}")
def remove_prediction(pred_id: int):
    delete_prediction(pred_id)
    return {"message": "Deleted successfully"}