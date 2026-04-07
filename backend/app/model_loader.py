def predict_price(data):
    # TEMPORARY fake
    price = (
        data.beds * 50000 +
        data.baths * 30000 +
        data.sqft * 150 +
        int(data.zip_code[-2:]) * 1000 +
        data.year * 10 +
        data.month * 500
    )
    return float(price)