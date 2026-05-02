import os
import pandas as pd
import yfinance as yf
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DATA_LOADER_PATH = r'C:\財經APP\data_loader.py'
SIGNAL_PATH = r'C:\財經APP\signal.py'

def patch_data_loader():
    if not os.path.exists(DATA_LOADER_PATH):
        print(f"Error: {DATA_LOADER_PATH} not found")
        return

    with open(DATA_LOADER_PATH, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Add _fetch_sox_data function if not exists
    sox_fetch_func = """
def _fetch_sox_data(start_date: str, end_date: str) -> pd.DataFrame:
    \"\"\"
    Fetches Philadelphia Semiconductor Index (^SOX) from yfinance.
    Returns DataFrame with [date, sox_close, sox_ma20].
    \"\"\"
    try:
        # Fetch data with extra buffer for MA calculation
        start_dt = pd.to_datetime(start_date) - pd.Timedelta(days=40)
        df = yf.download("^SOX", start=start_dt.strftime('%Y-%m-%d'), end=end_date, progress=False)
        if df.empty:
            return pd.DataFrame()
        
        df = df[['Close']].rename(columns={'Close': 'sox_close'})
        df['sox_ma20'] = df['sox_close'].rolling(window=20).mean()
        df = df.reset_index().rename(columns={'Date': 'date'})
        df['date'] = pd.to_datetime(df['date']).dt.tz_localize(None)
        return df[['date', 'sox_close', 'sox_ma20']].dropna()
    except Exception as e:
        print(f"Error fetching SOX data: {e}")
        return pd.DataFrame()
"""
    if '_fetch_sox_data' not in content:
        # Insert before load_universe or after other _fetch functions
        if 'def _fetch_margin_data' in content:
            content = content.replace('def _fetch_margin_data', sox_fetch_func + '\n\ndef _fetch_margin_data')
        else:
            content = content.replace('def load_universe', sox_fetch_func + '\n\ndef load_universe')

    # 2. Add SOX to load_universe
    sox_merge_logic = """
        # Merge SOX data (Macro Filter)
        sox_df = _fetch_sox_data(start_date, end_date)
        if not sox_df.empty:
            df_adj = pd.merge(df_adj, sox_df, on="date", how="left").fillna(method='ffill')
        else:
            df_adj["sox_close"] = 0.0
            df_adj["sox_ma20"] = 0.0
"""
    if 'Merge SOX data' not in content:
        # Insert after margin merge
        if 'df_adj["short_balance"] = 0.0' in content:
            content = content.replace('df_adj["short_balance"] = 0.0', 'df_adj["short_balance"] = 0.0' + sox_merge_logic)
        
    with open(DATA_LOADER_PATH, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Patched data_loader.py with SOX data")

def patch_signal():
    if not os.path.exists(SIGNAL_PATH):
        print(f"Error: {SIGNAL_PATH} not found")
        return

    with open(SIGNAL_PATH, 'r', encoding='utf-8') as f:
        content = f.read()

    # Update macro_ok logic
    macro_logic = """
    # 5. Macro (美股宏觀): SOX 指數 > 20日均線
    if "sox_close" in df.columns and "sox_ma20" in df.columns:
        macro_ok = df["sox_close"] > df["sox_ma20"]
    else:
        macro_ok = True  # 缺資料時放行
"""
    if 'macro_ok = True' in content:
        content = content.replace('    macro_ok = True', macro_logic)
    elif 'macro_ok =' in content:
        # Replace existing logic if any
        import re
        content = re.sub(r'    macro_ok =.*', macro_logic, content)

    with open(SIGNAL_PATH, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Patched signal.py with SOX macro logic")

if __name__ == "__main__":
    patch_data_loader()
    patch_signal()
