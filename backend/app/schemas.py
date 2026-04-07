from pydantic import BaseModel


class PredictionInput(BaseModel):
    zip_code: str
    beds: int
    baths: int
    sqft: int
    year: int
    month: int


class PredictionOutput(BaseModel):
    id: int
    zip_code: str
    beds: int
    baths: int
    sqft: int
    year: int
    month: int
    predicted_price: float
    