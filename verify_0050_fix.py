
import pandas as pd
import numpy as np
import sys
import os
import importlib.util

# Ensure we use the freshly patched signal.py
spec = importlib.util.spec_from_file_location("signal_module", r"C:\財經APP\signal.py")
signal_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(signal_module)

# Mock data (tz-naive)
n = 100
dates = pd.date_range("2026-01-01", periods=n)
df = pd.DataFrame({
    'open': [100.0] * n,
    'high': [105.0] * n,
    'low': [100.0] * n,
    'close': [100.0] * n,
    'volume': [10000.0] * n,
    'whale_net_buy': [10.0] * n,
    'margin_balance': [1000.0] * n,
    'sox_close': [5000.0] * n,
    'sox_ma20': [4000.0] * n,
    'ma5': [99.0] * n,
    'ma10': [98.0] * n,
    'ma20': [97.0] * n,
    'ma60': [95.0] * n,
    'rsi14': [60.0] * n,
    'vol_ma20': [8000.0] * n,
    'san_yang': [False] * n,
    'swing_low': [90.0] * n
}, index=dates)

df.loc[dates[95:], 'san_yang'] = True

# Test 1: market_is_bull is None (should be True by default)
result_none = signal_module.generate_signals(df, market_is_bull=None)
print("Test 1 (None): Signal count =", result_none['signal'].sum())

# Test 2: market_is_bull is tz-aware (yfinance style)
# This was the failing case!
market_dates = pd.date_range("2026-01-01", periods=n).tz_localize('Asia/Taipei')
market_is_bull = pd.Series([True] * n, index=market_dates)

result_aware = signal_module.generate_signals(df, market_is_bull=market_is_bull)
print("Test 2 (Tz-Aware): Signal count =", result_aware['signal'].sum())

# Test 3: market_is_bull is False
market_is_bear = pd.Series([False] * n, index=market_dates)
result_bear = signal_module.generate_signals(df, market_is_bull=market_is_bear)
print("Test 3 (Bear Market): Signal count =", result_bear['signal'].sum())

if result_aware['signal'].sum() == 5 and result_bear['signal'].sum() == 0:
    print("\n✅ 0050 Market Filter Fix Verified!")
else:
    print("\n❌ Fix Verification Failed.")
