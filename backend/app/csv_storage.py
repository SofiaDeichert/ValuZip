import csv
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
CSV_FILE = BASE_DIR / "data" / "predictions.csv"

FIELDNAMES = ["id", "zip_code", "beds", "baths", "sqft", "year", "month", "predicted_price"]


def read_predictions():
    with open(CSV_FILE, mode="r", newline="") as file:
        reader = csv.DictReader(file)
        return list(reader)


def save_prediction(row):
    rows = read_predictions()
    new_id = 1 if not rows else max(int(r["id"]) for r in rows) + 1
    row["id"] = new_id

    with open(CSV_FILE, mode="a", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=FIELDNAMES)
        writer.writerow(row)

    return row


def delete_prediction(pred_id):
    rows = read_predictions()
    filtered_rows = [r for r in rows if int(r["id"]) != pred_id]

    with open(CSV_FILE, mode="w", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=FIELDNAMES)
        writer.writeheader()
        writer.writerows(filtered_rows)
        