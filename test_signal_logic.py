import pandas as pd
import numpy as np
import sys
import os

sys.path.append(r'C:\財經APP')

from signal_generator import generate_signals

# Mock data
df = pd.DataFrame({
    'close': [100, 101, 102],
    'whale_net_buy': [10, 20, 30],
    'margin_balance': [1000, 1005, 1010],
    'sox_close': [5000, 5100, 5200],
    'sox_ma20': [4000, 4000, 4000]
})

try:
    result = generate_signals(df)
    print("Signals generated successfully")
    # We can't easily see macro_ok because it's a local variable in the function
    # but we can check if it crashed or if the final signal is affected.
    # If I want to be sure, I'd need to modify signal.py to return it or log it.
    print("Columns in result:", result.columns)
except Exception as e:
    print(f"Error: {e}")
