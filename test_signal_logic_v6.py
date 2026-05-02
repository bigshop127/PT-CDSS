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
    'low': [96.0] * n,
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
})

# Trigger conditions
df.loc[90, 'san_yang'] = True # san_yang occurred 10 days ago (relative to end)
df.loc[95:, 'san_yang'] = True # recent san_yang

try:
    result = signal_module.generate_signals(df)
    print("Signals generated successfully")
    print("Signal counts (SOX OK):")
    print(result['signal'].value_counts())
    
    # Test with macro_ok = False
    df['sox_close'] = 3000.0
    result_fail = signal_module.generate_signals(df)
    print("\nAfter setting SOX < MA20:")
    print(result_fail['signal'].value_counts())
    
except Exception as e:
    import traceback
    print(f"Error: {e}")
    traceback.print_exc()
