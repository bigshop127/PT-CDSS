
import os

path = r'C:\財經APP\data_loader.py'

# 定義一個絕對正確的 load_universe 函式
NEW_LOAD_UNIVERSE = """
def load_universe(
    top_n: int = 50,
    cache_path: str = "cache_universe.parquet",
) -> dict[str, pd.DataFrame]:
    \"\"\"
    Returns {stock_id: DataFrame} for the MVP universe (Phase 1).
    top_n slices the hardcoded MVP_UNIVERSE list.
    DataFrames are forward-adjusted OHLCV + whale_net_buy + margin + SOX.
    \"\"\"
    start_date, end_date = _get_date_range()
    
    # Ensure 0050 is always in the list to be fetched/checked
    if "0050" not in MVP_UNIVERSE:
        MVP_UNIVERSE.insert(0, "0050")
        
    target_ids = MVP_UNIVERSE[:top_n]

    # --- 1. Attempt Cache Load ---
    if os.path.exists(cache_path):
        logger.info("Loading universe from cache: %s", cache_path)
        try:
            combined = pd.read_parquet(cache_path)
            universe: dict[str, pd.DataFrame] = {}
            for sid, grp in combined.groupby("stock_id"):
                grp = grp.drop(columns="stock_id").set_index("date").sort_index()
                universe[sid] = grp
            
            # Check for required columns
            sample_df = next(iter(universe.values()))
            required = ["whale_net_buy", "margin_balance", "sox_close"]
            missing = [c for c in required if c not in sample_df.columns]
            
            if missing:
                logger.info("Cache missing columns %s, clearing to re-fetch...", missing)
                os.remove(cache_path)
            else:
                logger.info("Cache loaded successfully with %d stocks", len(universe))
                return universe
        except Exception as e:
            logger.warning("Cache error: %s, clearing...", e)
            if os.path.exists(cache_path): os.remove(cache_path)

    # --- 2. Fetch Full History ---
    logger.info("Fetching %d stocks from APIs...", len(target_ids))
    universe = {}
    
    # Fetch SOX once for all stocks
    sox_df = _fetch_sox_data(start_date, end_date)
    
    for sid in target_ids:
        df_raw = _fetch_raw_price(sid, start_date, end_date)
        time.sleep(REQUEST_DELAY)
        if df_raw.empty: continue

        div_df = _fetch_dividends(sid, start_date, end_date)
        time.sleep(REQUEST_DELAY)
        
        whale_df = _fetch_institutional_investors(sid, start_date, end_date)
        time.sleep(REQUEST_DELAY)
        
        margin_df = _fetch_margin_data(sid, start_date, end_date)
        time.sleep(REQUEST_DELAY)

        df_adj = _apply_forward_adjust(df_raw, div_df)

        # Merge Whale
        if not whale_df.empty:
            df_adj = pd.merge(df_adj, whale_df, on="date", how="left").fillna({"whale_net_buy": 0})
        else:
            df_adj["whale_net_buy"] = 0.0

        # Merge Margin
        if not margin_df.empty:
            df_adj = pd.merge(df_adj, margin_df, on="date", how="left").fillna({"margin_balance": 0, "short_balance": 0})
        else:
            df_adj["margin_balance"] = 0.0
            df_adj["short_balance"] = 0.0
            
        # Merge SOX
        if not sox_df.empty:
            df_adj = pd.merge(df_adj, sox_df, on="date", how="left").ffill()
        else:
            df_adj["sox_close"] = 0.0
            df_adj["sox_ma20"] = 0.0

        df_adj = df_adj.set_index("date").sort_index()
        universe[sid] = df_adj
        logger.debug("Loaded %s", sid)

    # Cache for next time
    if universe:
        all_frames = []
        for sid, df in universe.items():
            tmp = df.reset_index()
            tmp["stock_id"] = sid
            all_frames.append(tmp)
        pd.concat(all_frames).to_parquet(cache_path)
        logger.info("Universe cached to %s", cache_path)

    return universe
"""

with open(path, 'r', encoding='utf-8') as f:
    full_text = f.read()

# 使用正則表達式取代整個函式
import re
pattern = r'def load_universe\(.*?\n    return universe'
# 注意：正則表達式需要處理多行與貪婪匹配
# 這裡採用更安全的方式：找到函式開始，直到下一個主要定義或檔案末尾
start_marker = 'def load_universe('
end_marker = '#  Fetch full history + dividends + whale data' # 借用下一個註解作為結束標記

if start_marker in full_text:
    parts = full_text.split(start_marker)
    pre_func = parts[0]
    post_func_rest = parts[1].split('return universe')
    # 我們要取代的是 parts[1] 的前面部分
    # 為了保險，我們直接組合：
    new_content = pre_func + NEW_LOAD_UNIVERSE + '\n' + post_func_rest[1]
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("load_universe has been completely rebuilt.")
else:
    print("Could not find load_universe start marker.")
