
import os

DATA_LOADER_PATH = r'C:\財經APP\data_loader.py'
SIGNAL_PATH = r'C:\財經APP\signal.py'

def fix_data_loader():
    with open(DATA_LOADER_PATH, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fix 0050 fallback timezone
    old_code = 'raw.index = pd.to_datetime(raw.index)\n                raw.index.name = "date"'
    new_code = 'raw.index = pd.to_datetime(raw.index).tz_localize(None)\n                raw.index.name = "date"'
    
    if old_code in content:
        content = content.replace(old_code, new_code)
        print("Fixed data_loader.py timezone issue.")
    else:
        print("data_loader.py timezone issue not found or already fixed.")
        
    with open(DATA_LOADER_PATH, 'w', encoding='utf-8') as f:
        f.write(content)

def fix_signal():
    with open(SIGNAL_PATH, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # 1. Fix timezone mismatch in reindex
    old_reindex = 'bull_mask = market_is_bull.reindex(df.index, fill_value=False)'
    new_reindex = 'bull_mask = market_is_bull.tz_localize(None).reindex(df.index.tz_localize(None), fill_value=False)'
    
    if old_reindex in content:
        content = content.replace(old_reindex, new_reindex)
        print("Fixed signal.py reindex timezone issue.")

    # 2. Integrate into Seven Dimensions
    # Let's find where df["signal"] is defined
    if 'order_flow_ok' in content and 'df["signal"] = (' in content:
        # Add market_ok dimension
        market_logic = """
    # 7. Market Regime (大盤趨勢/0050): 大盤收盤 > 60日均線
    if market_is_bull is not None:
        market_ok = market_is_bull.tz_localize(None).reindex(df.index.tz_localize(None), fill_value=False)
    else:
        market_ok = True
"""
        # Insert before df["signal"]
        content = content.replace('    df["signal"] = (', market_logic + '\n    df["signal"] = (')
        # Add to the chain
        content = content.replace('& order_flow_ok', '& order_flow_ok & market_ok')
        print("Integrated 0050 as 7th Dimension in signal.py.")

    # 3. Clean up the redundant post-filter at the end
    redundant_block = """    # -- Market Regime Filter (剜謆謍脣?) -------------------------
    # Block all buy signals when 0050 Close < MA60 (broad market in downtrend)
    if market_is_bull is not None:
        bull_mask = market_is_bull.reindex(df.index, fill_value=False)
        df["signal"] = df["signal"] & bull_mask"""
    
    # Use a more flexible match for the redundant block
    import re
    content = re.sub(r'# -- Market Regime Filter.*?return df', 'return df', content, flags=re.DOTALL)

    with open(SIGNAL_PATH, 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == "__main__":
    fix_data_loader()
    fix_signal()
