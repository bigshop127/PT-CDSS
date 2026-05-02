import os
import requests
import pandas as pd
from datetime import datetime, timedelta

FINMIND_API_URL = "https://api.finmindtrade.com/api/v4/data"
FINMIND_TOKEN = os.getenv("FINMIND_TOKEN", "")

def test_fetch_nasdaq():
    end = datetime.today().strftime("%Y-%m-%d")
    start = (datetime.today() - timedelta(days=60)).strftime("%Y-%m-%d")
    
    params = {
        "dataset": "USStockPrice",
        "data_id": "^IXIC",
        "start_date": start,
        "end_date": end,
        "token": FINMIND_TOKEN,
    }
    
    resp = requests.get(FINMIND_API_URL, params=params)
    if resp.status_code == 200:
        data = resp.json().get("data", [])
        if data:
            df = pd.DataFrame(data)
            print(df.tail())
        else:
            print("No data found")
    else:
        print(f"Error: {resp.status_code}")

if __name__ == "__main__":
    test_fetch_nasdaq()
