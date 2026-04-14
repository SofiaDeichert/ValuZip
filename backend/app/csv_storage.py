import csv
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
CSV_FILE = BASE_DIR / "data" / "predictions.csv"

FIELDNAMES = ["id", "zip_code", "beds", "baths", "sqft", "year", "month", "predicted_price"]


def _reset_csv():
    """Write a clean CSV with just the header row."""
    CSV_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(CSV_FILE, mode="w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
        writer.writeheader()


def read_predictions() -> list[dict]:
    """Read all predictions. Auto-repairs the file if it's missing or has a bad header."""
    if not CSV_FILE.exists():
        _reset_csv()
        return []

    with open(CSV_FILE, mode="r", newline="") as f:
        reader = csv.DictReader(f)
        # If the header doesn't match (corrupt/empty/wrong columns), reset and return empty
        if reader.fieldnames != FIELDNAMES:
            _reset_csv()
            return []
        rows = list(reader)

    # Filter out any rows that are missing the 'id' field (e.g. blank lines)
    return [r for r in rows if r.get("id", "").strip()]


def save_prediction(row: dict) -> dict:
    rows = read_predictions()
    new_id = 1 if not rows else max(int(r["id"]) for r in rows) + 1
    row["id"] = new_id

    with open(CSV_FILE, mode="a", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
        writer.writerow(row)

    return row


def delete_prediction(pred_id: int) -> bool:
    rows = read_predictions()
    filtered = [r for r in rows if int(r["id"]) != pred_id]

    if len(filtered) == len(rows):
        return False  # nothing deleted

    with open(CSV_FILE, mode="w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
        writer.writeheader()
        writer.writerows(filtered)

    return True