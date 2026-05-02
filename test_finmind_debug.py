import os
import requests
import json
from datetime import datetime, timedelta

FINMIND_API_URL = "https://api.finmindtrade.com/api/v4/data"
FINMIND_TOKEN = os.getenv("FINMIND_TOKEN", "")

def test_fetch_institutional():
    end = datetime.today().strftime("%Y-%m-%d")
    start = (datetime.today() - timedelta(days=30)).strftime("%Y-%m-%d")
    
    params = {
        "dataset": "TaiwanStockInstitutionalInvestorsBuySell",
        "data_id": "2330",
        "start_date": start,
        "end_date": end,
        "token": FINMIND_TOKEN,
    }
    
    resp = requests.get(FINMIND_API_URL, params=params)
    print(f"Status Code: {resp.status_code}")
    try:
        print(json.dumps(resp.json(), indent=2))
    except:
        print(resp.text)

if __name__ == "__main__":
    test_fetch_institutional()
