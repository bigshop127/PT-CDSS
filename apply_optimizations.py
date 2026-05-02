
import os
import re

DATA_LOADER_PATH = r'C:\財經APP\data_loader.py'
MAIN_PATH = r'C:\財經APP\main.py'
BACKTEST_PATH = r'C:\財經APP\backtest.py'

def patch_data_loader():
    with open(DATA_LOADER_PATH, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Add OTC fetch in load_universe
    otc_logic = """
    # --- 1.5 Fetch OTC for Market Filter ---
    otc_is_bull = None
    try:
        otc_raw = yf.download("^TWO", start=start_date, end=end_date, progress=False)
        if not otc_raw.empty:
            if isinstance(otc_raw.columns, pd.MultiIndex):
                otc_raw.columns = [c[0].lower() for c in otc_raw.columns]
            else:
                otc_raw.columns = [c.lower() for c in otc_raw.columns]
            otc_raw.index = pd.to_datetime(otc_raw.index).tz_localize(None)
            otc_ma60 = otc_raw["close"].rolling(60).mean()
            otc_is_bull = otc_raw["close"] > otc_ma60
            logger.info("OTC Index fetched for secondary filter.")
    except Exception as e:
        logger.warning("Failed to fetch OTC index: %s", e)
"""
    if 'otc_is_bull = None' not in content:
        content = content.replace('start_date, end_date = _get_date_range()', 'start_date, end_date = _get_date_range()' + otc_logic)
        # We need a way to pass otc_is_bull out or just handle it in main.
        # Let's just fetch it in main.py instead to keep data_loader clean.
        pass

def patch_main():
    with open(MAIN_PATH, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Add OTC fetch and combined bull status
    otc_import = "    import yfinance as yf\n"
    if 'import yfinance' not in content:
        content = "import yfinance as yf\n" + content

    old_regime = """    market_is_bull = None
    if "0050" in universe:
        df_0050 = add_indicators(universe["0050"])
        market_is_bull = df_0050["close"] > df_0050["ma60"]
        bull_days = int(market_is_bull.sum())
        total_days = len(market_is_bull)
        logger.info("Market regime filter ready: %d/%d bull days (%.1f%%)",
                    bull_days, total_days, bull_days / total_days * 100)"""

    new_regime = """    market_is_bull = None
    if "0050" in universe:
        df_0050 = add_indicators(universe["0050"])
        bull_0050 = df_0050["close"] > df_0050["ma60"]
        
        # Add OTC Filter
        logger.info("Fetching OTC Index (^TWO) for secondary filter...")
        try:
            otc_df = yf.download("^TWO", start=df_0050.index[0], end=df_0050.index[-1], progress=False)
            if isinstance(otc_df.columns, pd.MultiIndex): otc_df.columns = otc_df.columns.get_level_values(0)
            otc_df.index = pd.to_datetime(otc_df.index).tz_localize(None)
            otc_ma60 = otc_df["Close"].rolling(60).mean()
            bull_otc = otc_df["Close"] > otc_ma60
            
            # Combine: Both must be bull
            market_is_bull = bull_0050 & bull_otc.reindex(bull_0050.index, method='ffill').fillna(False)
            logger.info("Market regime: 0050 & OTC Dual Filter active.")
        except Exception as e:
            logger.warning("OTC fetch failed, falling back to 0050 only: %s", e)
            market_is_bull = bull_0050

        bull_days = int(market_is_bull.sum())
        total_days = len(market_is_bull)
        logger.info("Market regime filter ready: %d/%d bull days (%.1f%%)",
                    bull_days, total_days, bull_days / total_days * 100)"""

    if old_regime in content:
        content = content.replace(old_regime, new_regime)
        with open(MAIN_PATH, 'w', encoding='utf-8') as f:
            f.write(content)
        print("Patched main.py with Dual Market Filter (0050 + OTC).")

def patch_backtest():
    with open(BACKTEST_PATH, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Change Exit Logic for Trailing Stop
    # Replace TP2 logic with MA10 cross-down
    old_tp2_block = """            if pos.tp1_triggered and rr >= TP2_RR and pos.remaining_size > 0:
                tp_exit_price = next_open if not pd.isna(next_open) else close
                tp_exit_date = next_date if not pd.isna(next_date) else ev_date
                capital = _close_partial(
                    pos, tp_exit_date, tp_exit_price,
                    pos.remaining_size, "TP_2.5R", trades, capital
                )
                del open_positions[symbol]"""
    
    new_tp_trailing = """            # Trailing Stop for the remaining 50%
            # If TP1 is hit, we wait for a Close < MA10 to exit fully (Lao Wang Style)
            if pos.tp1_triggered and pos.remaining_size > 0:
                if close < ev["ma10"]:
                    exit_price = next_open if not pd.isna(next_open) else close
                    exit_date = next_date if not pd.isna(next_date) else ev_date
                    capital = _close_partial(
                        pos, exit_date, exit_price,
                        pos.remaining_size, "Trailing_MA10_Exit", trades, capital
                    )
                    del open_positions[symbol]
                    continue"""

    if old_tp2_block in content:
        content = content.replace(old_tp2_block, new_tp_trailing)
        with open(BACKTEST_PATH, 'w', encoding='utf-8') as f:
            f.write(content)
        print("Patched backtest.py with Trailing MA10 Stop logic.")

if __name__ == "__main__":
    patch_main()
    patch_backtest()
