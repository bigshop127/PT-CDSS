import pandas as pd
import numpy as np
import sys
import os
import importlib.util

spec = importlib.util.spec_from_file_location("signal_module", r"C:\財經APP\signal.py")
signal_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(signal_module)

# Mock data
n = 100
df = pd.DataFrame({
    'open': [100.0] * n,
    'high': [105.0] * n,
    'low': [95.0] * n,
    'close': [100.0] * n,
    'volume': [10000.0] * n,
    'whale_net_buy': [10.0] * n,
    'margin_balance': [1000.0] * n,
    'sox_close': [5000.0] * n,
    'sox_ma20': [4000.0] * n
})

try:
    result = signal_module.generate_signals(df)
    print("Signals generated successfully")
    if 'signal' in result.columns:
        print("Signal column exists.")
        print(result['signal'].value_counts())
    else:
        print("Signal column MISSING")
except Exception as e:
    import traceback
    print(f"Error: {e}")
    traceback.print_exc()
