import sys
import os

file_path = r'C:\財經APP\data_loader.py'

new_load_universe = """
def load_universe(
    top_n: int = 50,
    cache_path: str = "cache_universe.parquet",
) -> dict[str, pd.DataFrame]:
    \"\"\"
    Returns {stock_id: DataFrame} for the MVP universe (Phase 1).
    top_n slices the hardcoded MVP_UNIVERSE list.
    DataFrames are forward-adjusted OHLCV + whale_net_buy, indexed by DatetimeIndex.
    \"\"\"
    start_date, end_date = _get_date_range()
    target_ids = MVP_UNIVERSE[:top_n]

    #  Cache hit 
    if os.path.exists(cache_path):
        logger.info("Loading universe from cache: %s", cache_path)
        combined = pd.read_parquet(cache_path)
        universe: dict[str, pd.DataFrame] = {}
        for sid, grp in combined.groupby("stock_id"):
            grp = grp.drop(columns="stock_id").set_index("date").sort_index()
            universe[sid] = grp
        logger.info("Cache loaded: %d stocks", len(universe))
        
        # Check if whale data exists in cache
        sample_df = next(iter(universe.values()))
        if "whale_net_buy" not in sample_df.columns:
            logger.info("Whale data missing from cache, clearing cache to re-fetch...")
            os.remove(cache_path)
            # Re-fetch starts below
        else:
            # Ensure 0050 is present
            if "0050" not in universe:
                logger.info("Fetching 0050 (market regime filter) not in cache")
                df_raw = _fetch_raw_price("0050", start_date, end_date)
                if not df_raw.empty:
                    div_df = _fetch_dividends("0050", start_date, end_date)
                    df_adj = _apply_forward_adjust(df_raw, div_df)
                    df_adj["whale_net_buy"] = 0.0
                    df_adj = df_adj.set_index("date").sort_index()
                    universe["0050"] = df_adj
                    logger.info("0050 fetched and added to universe.")
            return universe

    #  Fetch full history + dividends + whale data 
    logger.info("Fetching %d MVP stocks (including Whale data) ", len(target_ids))
    universe = {}
    frames = []

    for i, sid in enumerate(target_ids):
        df_raw = _fetch_raw_price(sid, start_date, end_date)
        time.sleep(REQUEST_DELAY)

        div_df = _fetch_dividends(sid, start_date, end_date)
        time.sleep(REQUEST_DELAY)
        
        whale_df = _fetch_institutional_investors(sid, start_date, end_date)
        time.sleep(REQUEST_DELAY)

        if df_raw.empty:
            logger.warning("No price data for %s, skipping", sid)
            continue

        df_adj = _apply_forward_adjust(df_raw, div_df)
        
        # Merge whale data
        if not whale_df.empty:
            df_adj = pd.merge(df_adj, whale_df, on="date", how="left").fillna({"whale_net_buy": 0})
        else:
            df_adj["whale_net_buy"] = 0.0
            
        df_adj = df_adj.set_index("date").sort_index()
        universe[sid] = df_adj

        tmp = df_adj.copy().reset_index()
        tmp.insert(0, "stock_id", sid)
        frames.append(tmp)

        logger.info("  [%d/%d] %s  %d bars", i + 1, len(target_ids), sid, len(df_adj))

    if not frames:
        raise RuntimeError("No data fetched  check FINMIND_TOKEN and network.")

    pd.concat(frames, ignore_index=True).to_parquet(cache_path, index=False)
    logger.info("Universe cached  %s (%d stocks)", cache_path, len(universe))

    return universe
"""

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find the start of load_universe
start_idx = content.find("def load_universe(")
if start_idx != -1:
    content = content[:start_idx] + new_load_universe

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Rewrote load_universe in data_loader.py')
