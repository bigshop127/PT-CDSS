import pandas as pd
import numpy as np
import sys
import os
import importlib.util

spec = importlib.util.spec_from_file_location("signal_module", r"C:\財經APP\signal.py")
signal_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(signal_module)

# Mock data
df = pd.DataFrame({
    'close': [100.0] * 30,
    'whale_net_buy': [10.0] * 30,
    'margin_balance': [1000.0] * 30,
    'sox_close': [5000.0] * 30,
    'sox_ma20': [4000.0] * 30
})
# Add some variety for rolling/pct_change
df.loc[25:, 'margin_balance'] = 1200.0 # Increase margin
df.loc[25:, 'close'] = 101.0 # Slight increase

try:
    result = signal_module.generate_signals(df)
    print("Signals generated successfully")
    print("Result tail:")
    print(result[['close', 'signal']].tail())
except Exception as e:
    print(f"Error: {e}")
