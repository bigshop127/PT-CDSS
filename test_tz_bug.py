
import pandas as pd
import numpy as np

# Simulate FinMind index (tz-naive)
index_naive = pd.to_datetime(['2026-04-20', '2026-04-21', '2026-04-22'])
series_naive = pd.Series([True, True, True], index=index_naive)

# Simulate yfinance index (tz-aware)
index_aware = pd.to_datetime(['2026-04-20', '2026-04-21', '2026-04-22']).tz_localize('Asia/Taipei')
series_aware = pd.Series([True, True, True], index=index_aware)

print("Naive Index:")
print(index_naive)
print("\nAware Index:")
print(index_aware)

try:
    reindexed = series_aware.reindex(index_naive, fill_value=False)
    print("\nReindexed (Aware -> Naive):")
    print(reindexed)
except Exception as e:
    print(f"\nError reindexing Aware -> Naive: {e}")

try:
    reindexed_naive = series_naive.reindex(index_aware, fill_value=False)
    print("\nReindexed (Naive -> Aware):")
    print(reindexed_naive)
except Exception as e:
    print(f"\nError reindexing Naive -> Aware: {e}")
