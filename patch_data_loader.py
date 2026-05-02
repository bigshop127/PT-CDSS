import sys
import os

file_path = r'C:\財經APP\data_loader.py'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add _fetch_institutional_investors
fetch_whale_code = """
def _fetch_institutional_investors(stock_id: str, start_date: str, end_date: str) -> pd.DataFrame:
    \"\"\"
    Fetches TaiwanStockInstitutionalInvestorsBuySell and aggregates to daily net buy.
    Returns DataFrame with [date, whale_net_buy].
    \"\"\"
    rows = _finmind_get("TaiwanStockInstitutionalInvestorsBuySell", stock_id, start_date, end_date)
    if not rows:
        return pd.DataFrame(columns=["date", "whale_net_buy"])

    df = pd.DataFrame(rows)
    df["date"] = pd.to_datetime(df["date"])
    df["net_buy"] = pd.to_numeric(df["buy"], errors="coerce") - pd.to_numeric(df["sell"], errors="coerce")
    
    # Aggregate all categories (Foreign, Investment Trust, Dealer) per day
    daily = df.groupby("date")["net_buy"].sum().reset_index()
    daily = daily.rename(columns={"net_buy": "whale_net_buy"})
    return daily
"""

if '_fetch_institutional_investors' not in content:
    content = content.replace('def _fetch_dividends', fetch_whale_code + '\n\ndef _fetch_dividends')

# Update load_universe
old_load = """def load_universe(
    top_n: int = 50,
    cache_path: str = "cache_universe.parquet",
) -> dict[str, pd.DataFrame]:
    \"\"\"
    Returns {stock_id: DataFrame} for the MVP universe (Phase 1).
    top_n slices the hardcoded MVP_UNIVERSE list (useful for --top 10 smoke tests).
    DataFrames are forward-adjusted (儔甈) OHLCV, indexed by DatetimeIndex.
    \"\"\""""

new_load = """def load_universe(
    top_n: int = 50,
    cache_path: str = "cache_universe.parquet",
) -> dict[str, pd.DataFrame]:
    \"\"\"
    Returns {stock_id: DataFrame} for the MVP universe (Phase 1).
    top_n slices the hardcoded MVP_UNIVERSE list.
    DataFrames are forward-adjusted OHLCV + whale_net_buy, indexed by DatetimeIndex.
    \"\"\""""

content = content.replace(old_load, new_load)

# Update fetch loop
old_loop = """        df_adj = _apply_forward_adjust(df_raw, div_df)
        df_adj = df_adj.set_index("date").sort_index()"""

new_loop = """        whale_df = _fetch_institutional_investors(sid, start_date, end_date)
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
            
        df_adj = df_adj.set_index("date").sort_index()"""

content = content.replace(old_loop, new_loop)

# Update cache check
old_cache_check = """        logger.info("Cache loaded: %d stocks", len(universe))

        # Ensure 0050 (market regime proxy) is present even if not in original cache
        if "0050" not in universe:"""

new_cache_check = """        logger.info("Cache loaded: %d stocks", len(universe))
        
        # Check if whale data exists in cache
        sample_df = next(iter(universe.values()))
        if "whale_net_buy" not in sample_df.columns:
            logger.info("Whale data missing from cache, clearing cache to re-fetch...")
            os.remove(cache_path)
            # Re-fetch starts below
        else:
            # Ensure 0050 is present
            if "0050" not in universe:"""

content = content.replace(old_cache_check, new_cache_check)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated data_loader.py')
